import Loan from '../models/Loan.js';
import Policy from '../models/Policy.js';
import Customer from '../models/Customer.js';

// Financial Calculation Engine Helper
export const computeLoanMath = (principal, annualRate, durationMonths, interestType) => {
  const P = Number(principal);
  const rate = Number(annualRate);
  const n = Number(durationMonths);

  let monthlyInstallment = 0;
  let totalInterest = 0;
  let totalPayable = 0;

  if (interestType === 'Reducing Balance') {
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

    return res.json({
      policyName: policy.policyName,
      ...mathResult,
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
    const { customerId, policyId, principalAmount, collateralDetails } = req.body;

    if (!customerId || !policyId || !principalAmount) {
      return res.status(400).json({ message: 'Please select a Customer, Policy, and enter Principal Amount.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found.' });
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

    const loan = await Loan.create({
      customer: customer._id,
      policy: policy._id,
      principalAmount: math.principalAmount,
      totalInterest: math.totalInterest,
      totalPayable: math.totalPayable,
      monthlyInstallment: math.monthlyInstallment,
      remainingBalance: math.totalPayable,
      collateralDetails: collateralDetails || '',
      status: 'Active',
      issuedBy: req.user._id,
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('customer', 'fullName phone nicNumber address')
      .populate('policy', 'policyName interestRate durationMonths interestType');

    return res.status(201).json({
      message: 'Loan issued successfully!',
      loan: populatedLoan,
    });
  } catch (error) {
    console.error('Error issuing loan:', error);
    return res.status(500).json({ message: 'Failed to issue loan', error: error.message });
  }
};

// @desc    Get Loans list (Filtered for Customer if logged in as Customer)
// @route   GET /api/loans
// @access  Private
export const getLoans = async (req, res) => {
  try {
    let filter = {};

    // If logged in user is a Customer, find their corresponding Customer record by phone/email
    if (req.user.role === 'Customer') {
      const customerRecord = await Customer.findOne({
        $or: [{ phone: req.user.phone }, { email: req.user.email }],
      });
      if (customerRecord) {
        filter.customer = customerRecord._id;
      }
    }

    const loans = await Loan.find(filter)
      .populate('customer', 'fullName phone nicNumber address')
      .populate('policy', 'policyName interestRate durationMonths interestType')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 });

    return res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return res.status(500).json({ message: 'Error retrieving loans' });
  }
};
