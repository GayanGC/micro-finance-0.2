import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import { computeCreditScore, scoreToCribCategory } from '../utils/creditScoring.js';
import { triggerNotification } from '../utils/notificationScheduler.js';

// @desc    Register a new Customer (Dual Auth structure)
// @route   POST /api/customers
// @access  Private (Admin & Agent)
export const registerCustomer = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      pin,
      address,
      nicNumber,
      kycStatus,
      monthlyIncome,
      monthlyExpenses,
      employmentType,
      guarantors,
      branch,
      center,
      group,
    } = req.body;

    if (!fullName || !phone || !pin || !address || !nicNumber) {
      return res.status(400).json({ message: 'Please provide all required customer registration fields.' });
    }

    if (pin.length < 4 || pin.length > 6) {
      return res.status(400).json({ message: 'PIN must be between 4 and 6 digits.' });
    }

    const customerExists = await Customer.findOne({ $or: [{ phone }, { nicNumber }] });
    if (customerExists) {
      return res.status(400).json({ message: 'A customer with this phone number or NIC already exists.' });
    }

    // Compute initial credit score
    const tempCustomer = {
      isBlacklisted: false,
      kycStatus: kycStatus || 'Pending',
      monthlyIncome: monthlyIncome || 0,
      monthlyExpenses: monthlyExpenses || 0,
      cribCategory: 'A',
      createdAt: new Date(),
    };
    const { score, riskTag } = computeCreditScore(tempCustomer, []);
    const cribCategory = scoreToCribCategory(score);

    // Handle Agent Assignment
    let agentId = req.body.assignedAgent || null;
    if (req.user.role === 'Agent') {
      agentId = req.user._id;
    }

    const customer = await Customer.create({
      fullName,
      phone,
      pin,
      address,
      nicNumber,
      kycStatus: kycStatus || 'Pending',
      registeredBy: req.user._id,
      assignedAgent: agentId,
      monthlyIncome: monthlyIncome || 0,
      monthlyExpenses: monthlyExpenses || 0,
      employmentType: employmentType || 'Other',
      guarantors: guarantors || [],
      creditScore: score,
      riskTag,
      cribCategory,
      branch: branch || 'HQ',
      center: center || '',
      group: group || '',
    });

    // Auto-create Customer portal user account using phone
    const userEmail = `${phone.replace(/[^0-9]/g, '')}@microfinance.com`;
    const userExists = await User.findOne({ phone });
    if (!userExists) {
      await User.create({
        name: fullName,
        email: userEmail,
        password: pin,
        role: 'Customer',
        phone,
        address,
        branch: branch || 'HQ',
      });
    }

    return res.status(201).json({
      message: 'Customer registered successfully!',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        phone: customer.phone,
        nicNumber: customer.nicNumber,
        kycStatus: customer.kycStatus,
        status: customer.status,
        creditScore: customer.creditScore,
        riskTag: customer.riskTag,
        cribCategory: customer.cribCategory,
        assignedAgent: customer.assignedAgent,
      },
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    return res.status(500).json({ message: 'Failed to register customer', error: error.message });
  }
};

// @desc    Get all Customers with filters (Agent data isolation enforced)
// @route   GET /api/customers
// @access  Private (Admin & Agent)
export const getCustomers = async (req, res) => {
  try {
    const { isBlacklisted, kycStatus, cribCategory, branch, riskTag } = req.query;
    const filter = {};

    if (isBlacklisted !== undefined) filter.isBlacklisted = isBlacklisted === 'true';
    if (kycStatus) filter.kycStatus = kycStatus;
    if (cribCategory) filter.cribCategory = cribCategory;
    if (branch) filter.branch = branch;
    if (riskTag) filter.riskTag = riskTag;

    // Enforce Agent Data Isolation
    if (req.user && req.user.role === 'Agent') {
      filter.$or = [{ assignedAgent: req.user._id }, { registeredBy: req.user._id }];
    }

    const customers = await Customer.find(filter)
      .populate('registeredBy', 'name role')
      .populate('assignedAgent', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving customers' });
  }
};

// @desc    Update customer — KYC, blacklist, income, guarantors, credit score recalculation
// @route   PUT /api/customers/:id
// @access  Private (Admin, credit_officer, super_admin)
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const {
      kycStatus,
      isBlacklisted,
      blacklistReason,
      cribCategory,
      monthlyIncome,
      monthlyExpenses,
      employmentType,
      status,
      guarantors,
      address,
      branch,
      center,
      group,
      assignedAgent,
    } = req.body;

    // Apply updates
    if (kycStatus !== undefined) customer.kycStatus = kycStatus;
    if (isBlacklisted !== undefined) customer.isBlacklisted = isBlacklisted;
    if (blacklistReason !== undefined) customer.blacklistReason = blacklistReason;
    if (cribCategory !== undefined) customer.cribCategory = cribCategory;
    if (monthlyIncome !== undefined) customer.monthlyIncome = monthlyIncome;
    if (monthlyExpenses !== undefined) customer.monthlyExpenses = monthlyExpenses;
    if (employmentType !== undefined) customer.employmentType = employmentType;
    if (status !== undefined) customer.status = status;
    if (guarantors !== undefined) customer.guarantors = guarantors;
    if (address !== undefined) customer.address = address;
    if (branch !== undefined) customer.branch = branch;
    if (center !== undefined) customer.center = center;
    if (group !== undefined) customer.group = group;
    if (assignedAgent !== undefined) customer.assignedAgent = assignedAgent || null;

    // Recalculate credit score after updates
    const existingLoans = await Loan.find({ customer: customer._id });
    const { score, riskTag } = computeCreditScore(customer, existingLoans);
    const newCribCategory = cribCategory || scoreToCribCategory(score);

    customer.creditScore = score;
    customer.riskTag = riskTag;
    customer.cribCategory = newCribCategory;

    await customer.save();

    // Trigger KYC notification
    if (kycStatus) {
      await triggerNotification('kyc_update', {
        customerId: customer._id,
        metadata: { kycStatus },
      });
    }

    // Trigger blacklist notification
    if (isBlacklisted === true) {
      await triggerNotification('blacklist_alert', {
        customerId: customer._id,
        metadata: { reason: blacklistReason },
      });
    }

    return res.json({
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
};

// @desc    Recalculate credit score for a specific customer
// @route   POST /api/customers/:id/score
// @access  Private (Admin, credit_officer, super_admin)
export const recalculateCreditScore = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const existingLoans = await Loan.find({ customer: customer._id });
    const { score, riskTag, breakdown } = computeCreditScore(customer, existingLoans);
    const cribCategory = scoreToCribCategory(score);

    customer.creditScore = score;
    customer.riskTag = riskTag;
    customer.cribCategory = cribCategory;
    await customer.save();

    return res.json({
      message: 'Credit score recalculated',
      creditScore: score,
      riskTag,
      cribCategory,
      breakdown,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to recalculate credit score', error: error.message });
  }
};

// @desc    Get unified Credit History Timeline for a customer
// @route   GET /api/customers/:id/timeline
// @access  Private (Admin, Agent, super_admin, credit_officer)
export const getCustomerTimeline = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('registeredBy', 'name role')
      .lean();

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    // Fetch all loans for this customer
    const loans = await Loan.find({ customer: customer._id })
      .populate('policy', 'policyName interestRate durationMonths interestType')
      .populate('issuedBy', 'name role')
      .lean();

    // Fetch all repayments across all customer's loans
    const loanIds = loans.map((l) => l._id);
    const Repayment = (await import('../models/Repayment.js')).default;
    const repayments = await Repayment.find({ loanId: { $in: loanIds } })
      .populate('collectedBy', 'name role')
      .lean();

    // ── Build unified events array ─────────────────────────────────
    const events = [];

    // Customer registration event
    events.push({
      date: customer.createdAt,
      type: 'CUSTOMER_REGISTERED',
      amount: 0,
      referenceId: String(customer._id).slice(-8).toUpperCase(),
      notes: `Customer registered by ${customer.registeredBy?.name || 'System'}. KYC: ${customer.kycStatus}.`,
      meta: { kycStatus: customer.kycStatus },
    });

    // Loan disbursement & milestone events
    for (const loan of loans) {
      events.push({
        date: loan.disbursedAt || loan.createdAt,
        type: 'DISBURSEMENT',
        amount: loan.principalAmount,
        referenceId: String(loan._id).slice(-8).toUpperCase(),
        notes: `Loan disbursed under policy "${loan.policy?.policyName || 'N/A'}". Total payable: ${Number(loan.totalPayable || 0).toFixed(2)}.`,
        meta: {
          loanId: loan._id,
          policyName: loan.policy?.policyName,
          interestRate: loan.policy?.interestRate,
          durationMonths: loan.policy?.durationMonths,
          status: loan.status,
          issuedBy: loan.issuedBy?.name,
        },
      });

      // Overdue / Defaulted flag event
      if ((loan.status === 'Overdue' || loan.status === 'Defaulted') && loan.overdueDays > 0) {
        events.push({
          date: loan.nextDueDate || loan.updatedAt,
          type: 'PENALTY',
          amount: 0,
          referenceId: String(loan._id).slice(-8).toUpperCase(),
          notes: `Loan ${loan.status.toUpperCase()} — ${loan.overdueDays} days overdue. PAR Bucket: ${loan.parBucket || 'N/A'}.`,
          meta: { loanId: loan._id, overdueDays: loan.overdueDays, parBucket: loan.parBucket },
        });
      }

      // Loan fully repaid milestone
      if (loan.status === 'Completed') {
        events.push({
          date: loan.updatedAt,
          type: 'LOAN_COMPLETED',
          amount: loan.totalPayable,
          referenceId: String(loan._id).slice(-8).toUpperCase(),
          notes: `Loan fully repaid! Total paid: ${Number(loan.totalPayable || 0).toFixed(2)}.`,
          meta: { loanId: loan._id },
        });
      }
    }

    // Repayment events
    for (const r of repayments) {
      events.push({
        date: r.paymentDate || r.createdAt,
        type: 'REPAYMENT',
        amount: r.amountPaid,
        referenceId: r.receiptNumber,
        notes: `Payment via ${r.paymentMethod}. Balance after: ${Number(r.newRemainingBalance || 0).toFixed(2)}. Collected by: ${r.collectedBy?.name || 'System'}.`,
        meta: {
          receiptNumber: r.receiptNumber,
          paymentMethod: r.paymentMethod,
          newRemainingBalance: r.newRemainingBalance,
          penaltyPaid: r.penaltyPaid,
          collectedBy: r.collectedBy?.name,
        },
      });

      // Separate penalty node if penalty was paid
      if (r.penaltyPaid > 0) {
        events.push({
          date: r.paymentDate || r.createdAt,
          type: 'PENALTY',
          amount: r.penaltyPaid,
          referenceId: r.receiptNumber,
          notes: `Late fee of ${Number(r.penaltyPaid).toFixed(2)} included in this payment.`,
          meta: { penaltyPaid: r.penaltyPaid },
        });
      }
    }

    // Sort chronologically (oldest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ── Portfolio summary ──────────────────────────────────────────
    const summary = {
      totalBorrowed: loans.reduce((s, l) => s + (l.principalAmount || 0), 0),
      totalPayable: loans.reduce((s, l) => s + (l.totalPayable || 0), 0),
      totalPaid: repayments.reduce((s, r) => s + (r.amountPaid || 0), 0),
      totalOutstanding: loans
        .filter((l) => l.status !== 'Completed')
        .reduce((s, l) => s + (l.remainingBalance || 0), 0),
      activeLoans: loans.filter((l) => l.status === 'Active').length,
      completedLoans: loans.filter((l) => l.status === 'Completed').length,
      overdueLoans: loans.filter((l) => l.status === 'Overdue' || l.status === 'Defaulted').length,
      totalLoans: loans.length,
      creditScore: customer.creditScore || 0,
      riskTag: customer.riskTag || 'Low',
      cribCategory: customer.cribCategory || 'A',
    };

    // Round currency values
    ['totalBorrowed', 'totalPayable', 'totalPaid', 'totalOutstanding'].forEach((k) => {
      summary[k] = Math.round(summary[k] * 100) / 100;
    });

    return res.json({ customer, summary, events, loans });
  } catch (error) {
    console.error('[getCustomerTimeline] Error:', error);
    return res.status(500).json({ message: 'Failed to load customer timeline', error: error.message });
  }
};
