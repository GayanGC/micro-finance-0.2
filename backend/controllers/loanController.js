import Loan from '../models/Loan.js';
import Policy from '../models/Policy.js';
import Customer from '../models/Customer.js';
import Holiday from '../models/Holiday.js';
import { computePenalty, generateAmortizationSchedule, classifyPAR } from '../utils/penaltyEngine.js';
import { triggerNotification } from '../utils/notificationScheduler.js';
import { shiftDueDateAsync } from '../utils/dateHelpers.js';
import { sendWhatsApp, TEMPLATES } from '../utils/whatsappService.js';
import { postAutomaticJournalEntry } from '../utils/accountingHelper.js';

// Financial Calculation Engine Helper
export const computeLoanMath = (principal, annualRate, durationMonths, interestType) => {
  const P = Number(principal);
  const rate = Number(annualRate);
  const n = Number(durationMonths);

  let monthlyInstallment = 0;
  let totalInterest = 0;
  let totalPayable = 0;

  if (interestType === 'Reducing Balance' || interestType === 'Amortization') {
    const r = rate / 100 / 12; // Monthly interest rate decimal
    if (r === 0) {
      monthlyInstallment = P / n;
      totalPayable = P;
      totalInterest = 0;
    } else {
      const powFactor = Math.pow(1 + r, n);
      monthlyInstallment = P * ((r * powFactor) / (powFactor - 1));
      totalPayable = monthlyInstallment * n;
      totalInterest = totalPayable - P;
    }
  } else {
    // Flat Rate Default Formula
    totalInterest = P * (rate / 100) * (n / 12);
    totalPayable = P + totalInterest;
    monthlyInstallment = totalPayable / n;
  }

  return {
    principalAmount: Math.round(P * 100) / 100,
    annualRate,
    durationMonths: n,
    interestType,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    monthlyInstallment: Math.round(monthlyInstallment * 100) / 100,
  };
};

// @desc    Calculate Loan Installments before saving
// @route   POST /api/loans/calculate
// @access  Private
export const calculateLoan = async (req, res) => {
  try {
    const { policyId, principalAmount } = req.body;

    if (!policyId || !principalAmount) {
      return res.status(400).json({ message: 'Please provide both policyId and principalAmount' });
    }

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ message: 'Selected loan policy not found' });
    }

    const mathResult = computeLoanMath(
      principalAmount,
      policy.interestRate,
      policy.durationMonths,
      policy.interestType
    );

    // Also generate amortization schedule preview
    const schedule = generateAmortizationSchedule(
      principalAmount,
      policy.interestRate,
      policy.durationMonths,
      policy.interestType,
      new Date()
    );

    return res.json({
      policyName: policy.policyName,
      ...mathResult,
      amortizationSchedule: schedule,
    });
  } catch (error) {
    console.error('Error calculating loan:', error);
    return res.status(500).json({ message: 'Failed to calculate loan installments', error: error.message });
  }
};

// @desc    Issue a new Loan
// @route   POST /api/loans
// @access  Private (Admin & Agent)
export const createLoan = async (req, res) => {
  try {
    const {
      customerId,
      policyId,
      principalAmount,
      collateralDetails,
      collateral,
      guarantorCustomers,
      penaltyRate,
      gracePeriod,
      penaltyInterestRate,
      isEnterpriseMode,
      sendWhatsAppMsg = true, // Default ON
    } = req.body;

    if (!customerId || !policyId || !principalAmount) {
      return res.status(400).json({ message: 'Please select a Customer, Policy, and enter Principal Amount.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found.' });
    }

    if (customer.isBlacklisted) {
      return res.status(400).json({ message: 'Cannot issue loan to a blacklisted customer.' });
    }

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ message: 'Selected policy not found.' });
    }

    // Compute math logic
    const math = computeLoanMath(
      principalAmount,
      policy.interestRate,
      policy.durationMonths,
      policy.interestType
    );

    // Set first due date (30 days from now) — shifted past any holidays
    const rawNextDue = new Date();
    rawNextDue.setDate(rawNextDue.getDate() + 30);
    const nextDueDate = await shiftDueDateAsync(rawNextDue);

    // In Enterprise mode, loan starts as Pending (needs approval)
    const enterpriseMode = isEnterpriseMode === true;
    const initialStatus = enterpriseMode ? 'Pending' : 'Active';

    const holidays = await Holiday.find({});
    const rawSchedule = generateAmortizationSchedule(
      math.principalAmount,
      policy.interestRate,
      policy.durationMonths,
      policy.interestType,
      nextDueDate,
      holidays
    );

    const repaymentSchedule = rawSchedule.map((s) => ({
      installmentNo: s.installmentNo,
      dueDate: new Date(s.dueDate),
      expectedInstallment: s.emi || s.expectedInstallment,
      principalComponent: s.principalComponent,
      interestComponent: s.interestComponent,
      status: 'pending',
    }));

    const loan = await Loan.create({
      customer: customer._id,
      policy: policy._id,
      principalAmount: math.principalAmount,
      totalInterest: math.totalInterest,
      totalPayable: math.totalPayable,
      monthlyInstallment: math.monthlyInstallment,
      remainingBalance: math.totalPayable,
      remainingPrincipal: math.principalAmount,
      repaymentSchedule,
      collateralDetails: collateralDetails || '',
      collateral: collateral || null,
      guarantorCustomers: guarantorCustomers || [],
      status: initialStatus,
      issuedBy: req.user._id,
      penaltyRate: penaltyRate || 2,
      gracePeriod: gracePeriod !== undefined ? Number(gracePeriod) : 0,
      penaltyInterestRate: penaltyInterestRate !== undefined ? Number(penaltyInterestRate) : 0,
      interestMethod: policy.interestType,
      nextDueDate,
      isEnterpriseMode: enterpriseMode,
      approvalWorkflow: {
        agentApproved: !enterpriseMode,
        currentStage: enterpriseMode ? 'agent_review' : 'fully_approved',
      },
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('customer', 'fullName phone nicNumber address creditScore riskTag')
      .populate('policy', 'policyName interestRate durationMonths interestType');

    // Automatic General Ledger Journal Entry (for active disbursed loans)
    if (initialStatus === 'Active') {
      postAutomaticJournalEntry({
        date: new Date(),
        referenceId: String(loan._id).slice(-8).toUpperCase(),
        description: `Loan Principal Disbursement for ${customer.fullName}`,
        debitAccountName: 'Loans Principal Receivable',
        creditAccountName: 'Cash on Hand / Vault',
        amount: math.principalAmount,
        createdBy: req.user._id,
      }).catch(() => {});
    }

    // Send approval notification if enterprise mode
    if (enterpriseMode) {
      await triggerNotification('loan_approval', {
        loanId: loan._id,
        customerId: customer._id,
        metadata: { stage: 'pending_agent_review' },
      });
    }

    // WhatsApp notification
    if (sendWhatsAppMsg && customer.phone) {
      const policyName = populatedLoan?.policy?.policyName || policy.policyName || 'Standard';
      const nextDueStr = nextDueDate
        ? new Date(nextDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A';
      const msg = enterpriseMode
        ? `📋 *Loan Application Submitted*\n\nDear *${customer.fullName}*,\n\nYour loan application of *$${math.principalAmount.toFixed(2)}* is under review. You will be notified upon approval.\n\n— MicroFinance Team`
        : TEMPLATES.loan_approved(customer.fullName, math.principalAmount, policyName, nextDueStr);
      sendWhatsApp(customer.phone, msg).catch(() => {}); // Non-blocking
    }

    return res.status(201).json({
      message: enterpriseMode
        ? 'Loan application submitted for approval!'
        : 'Loan issued successfully!',
      loan: populatedLoan,
    });
  } catch (error) {
    console.error('Error issuing loan:', error);
    return res.status(500).json({ message: 'Failed to issue loan', error: error.message });
  }
};

// @desc    Get Loans list with advanced filters
// @route   GET /api/loans
// @access  Private
export const getLoans = async (req, res) => {
  try {
    let filter = {};
    const { parBucket, branch, status, assetType, customerId: qCustomerId } = req.query;

    // If logged in user is a Customer, find their corresponding Customer record
    if (req.user.role === 'Customer') {
      const customerRecord = await Customer.findOne({
        $or: [{ phone: req.user.phone }, { email: req.user.email }],
      });
      if (customerRecord) {
        filter.customer = customerRecord._id;
      }
    }

    // Advanced filters
    if (parBucket) filter.parBucket = parBucket;
    if (branch) filter.branch = branch;
    if (status) filter.status = status;
    if (qCustomerId) filter.customer = qCustomerId;

    // Asset type filter (filter on collateral.assetType)
    let loans = await Loan.find(filter)
      .populate('customer', 'fullName phone nicNumber address creditScore riskTag isBlacklisted kycStatus cribCategory')
      .populate('policy', 'policyName interestRate durationMonths interestType')
      .populate('issuedBy', 'name role')
      .populate('approvalWorkflow.agentApprovedBy', 'name role')
      .populate('approvalWorkflow.creditOfficerApprovedBy', 'name role')
      .populate('approvalWorkflow.branchManagerApprovedBy', 'name role')
      .sort({ createdAt: -1 });

    // Filter by asset type post-population
    if (assetType) {
      loans = loans.filter((l) => l.collateral?.assetType === assetType);
    }

    return res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return res.status(500).json({ message: 'Error retrieving loans' });
  }
};

// @desc    Get single loan with penalty computed
// @route   GET /api/loans/:id
// @access  Private
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customer', 'fullName phone nicNumber address creditScore riskTag isBlacklisted kycStatus guarantors')
      .populate('policy', 'policyName interestRate durationMonths interestType')
      .populate('issuedBy', 'name role')
      .populate('guarantorCustomers', 'fullName phone nicNumber');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Compute current penalty
    const penaltyInfo = computePenalty(loan);

    return res.json({ loan, penaltyInfo });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving loan', error: error.message });
  }
};

// @desc    Get amortization schedule for a loan
// @route   GET /api/loans/:id/schedule
// @access  Private
export const getAmortizationSchedule = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('policy');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    // Fetch holidays for holiday-aware schedule
    const holidays = await Holiday.find({}).lean();

    const schedule = generateAmortizationSchedule(
      loan.principalAmount,
      loan.policy.interestRate,
      loan.policy.durationMonths,
      loan.interestMethod || loan.policy.interestType,
      loan.disbursedAt,
      holidays
    );

    const penaltyInfo = computePenalty(loan);

    return res.json({ schedule, penaltyInfo, loan: { _id: loan._id, remainingBalance: loan.remainingBalance, status: loan.status } });
  } catch (error) {
    return res.status(500).json({ message: 'Error generating schedule', error: error.message });
  }
};

// @desc    Multi-level loan approval (Enterprise mode)
// @route   PUT /api/loans/:id/approve
// @access  Private (Agent, credit_officer, super_admin/Admin)
export const approveLoan = async (req, res) => {
  try {
    const { stage, action, rejectionReason } = req.body; // stage: 'agent' | 'credit_officer' | 'branch_manager'
    const loan = await Loan.findById(req.params.id).populate('customer');

    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.status === 'Active') return res.status(400).json({ message: 'Loan is already active/approved.' });

    const isRejection = action === 'reject';

    if (isRejection) {
      loan.status = 'Rejected';
      loan.approvalWorkflow.currentStage = 'rejected';
      loan.approvalWorkflow.rejectionReason = rejectionReason || 'Rejected by reviewer';
      await loan.save();

      await triggerNotification('loan_rejection', {
        loanId: loan._id,
        customerId: loan.customer?._id,
        metadata: { rejectionReason },
      });

      return res.json({ message: 'Loan rejected', loan });
    }

    // Process approval by stage
    if (stage === 'agent') {
      loan.approvalWorkflow.agentApproved = true;
      loan.approvalWorkflow.agentApprovedAt = new Date();
      loan.approvalWorkflow.agentApprovedBy = req.user._id;
      loan.approvalWorkflow.currentStage = 'credit_officer_review';
    } else if (stage === 'credit_officer') {
      if (!loan.approvalWorkflow.agentApproved) {
        return res.status(400).json({ message: 'Agent approval required first.' });
      }
      loan.approvalWorkflow.creditOfficerApproved = true;
      loan.approvalWorkflow.creditOfficerApprovedAt = new Date();
      loan.approvalWorkflow.creditOfficerApprovedBy = req.user._id;
      loan.approvalWorkflow.currentStage = 'branch_manager_review';
    } else if (stage === 'branch_manager') {
      if (!loan.approvalWorkflow.creditOfficerApproved) {
        return res.status(400).json({ message: 'Credit Officer approval required first.' });
      }
      loan.approvalWorkflow.branchManagerApproved = true;
      loan.approvalWorkflow.branchManagerApprovedAt = new Date();
      loan.approvalWorkflow.branchManagerApprovedBy = req.user._id;
      loan.approvalWorkflow.currentStage = 'fully_approved';
      loan.status = 'Active'; // Final approval — activate loan

      // Automatic General Ledger Journal Entry upon final disbursement approval
      postAutomaticJournalEntry({
        date: new Date(),
        referenceId: String(loan._id).slice(-8).toUpperCase(),
        description: `Approved Loan Principal Disbursement for ${loan.customer?.fullName || 'Customer'}`,
        debitAccountName: 'Loans Principal Receivable',
        creditAccountName: 'Cash on Hand / Vault',
        amount: loan.principalAmount,
        createdBy: req.user._id,
      }).catch(() => {});

      await triggerNotification('loan_approval', {
        loanId: loan._id,
        customerId: loan.customer?._id,
        metadata: { fullyApproved: true },
      });
    } else {
      return res.status(400).json({ message: 'Invalid approval stage. Use: agent | credit_officer | branch_manager' });
    }

    await loan.save();
    const populated = await Loan.findById(loan._id)
      .populate('customer', 'fullName phone')
      .populate('issuedBy', 'name role');

    return res.json({ message: `Loan ${stage} approval recorded.`, loan: populated });
  } catch (error) {
    console.error('Loan approval error:', error);
    return res.status(500).json({ message: 'Failed to process loan approval', error: error.message });
  }
};

// @desc    Update PAR buckets for all active loans (batch job)
// @route   POST /api/loans/update-par
// @access  Private (Admin, super_admin)
export const updatePARBuckets = async (req, res) => {
  try {
    const activeLoans = await Loan.find({ status: 'Active' });
    let updated = 0;

    for (const loan of activeLoans) {
      const { overdueDays, parBucket } = computePenalty(loan);
      loan.overdueDays = overdueDays;
      loan.parBucket = parBucket;
      await loan.save();
      updated++;
    }

    return res.json({ message: `PAR buckets updated for ${updated} loans`, updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update PAR buckets', error: error.message });
  }
};
