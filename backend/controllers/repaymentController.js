import Repayment from '../models/Repayment.js';
import Loan from '../models/Loan.js';
import Customer from '../models/Customer.js';

// @desc    Submit a Repayment & deduct from Loan remaining balance
// @route   POST /api/repayments/add
// @access  Private (Admin & Agent)
export const addRepayment = async (req, res) => {
  try {
    const { loanId, amountPaid, paymentMethod } = req.body;

    if (!loanId || !amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ message: 'Please provide a valid loan ID and positive payment amount.' });
    }

    const loan = await Loan.findById(loanId).populate('customer');
    if (!loan) {
      return res.status(404).json({ message: 'Associated loan not found.' });
    }

    if (loan.status === 'Completed') {
      return res.status(400).json({ message: 'This loan has already been fully paid and completed.' });
    }

    const payAmount = Number(amountPaid);
    const newBalance = Math.max(0, Math.round((loan.remainingBalance - payAmount) * 100) / 100);

    // Generate unique receipt number
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${dateCode}-${randomSuffix}`;

    // Create Repayment Record
    const repayment = await Repayment.create({
      loanId: loan._id,
      customerId: loan.customer._id,
      amountPaid: payAmount,
      paymentMethod: paymentMethod || 'Cash',
      collectedBy: req.user._id,
      receiptNumber,
      newRemainingBalance: newBalance,
    });

    // Update Loan remaining balance & status automatically
    loan.remainingBalance = newBalance;
    if (newBalance <= 0) {
      loan.status = 'Completed';
    }
    await loan.save();

    const populatedRepayment = await Repayment.findById(repayment._id)
      .populate('customerId', 'fullName phone nicNumber address')
      .populate('loanId', 'principalAmount remainingBalance monthlyInstallment')
      .populate('collectedBy', 'name role');

    return res.status(201).json({
      message: newBalance === 0 ? 'Repayment logged! Loan is now FULLY COMPLETED!' : 'Repayment recorded successfully!',
      repayment: populatedRepayment,
      loanCompleted: newBalance === 0,
    });
  } catch (error) {
    console.error('Error recording repayment:', error);
    return res.status(500).json({ message: 'Failed to record repayment', error: error.message });
  }
};

// @desc    Get Repayment transaction ledger
// @route   GET /api/repayments
// @access  Private
export const getRepayments = async (req, res) => {
  try {
    let filter = {};

    // Filter by Customer if logged in as Customer
    if (req.user.role === 'Customer') {
      const customerRecord = await Customer.findOne({
        $or: [{ phone: req.user.phone }, { email: req.user.email }],
      });
      if (customerRecord) {
        filter.customerId = customerRecord._id;
      }
    }

    const repayments = await Repayment.find(filter)
      .populate('customerId', 'fullName phone nicNumber address')
      .populate('loanId', 'principalAmount remainingBalance monthlyInstallment')
      .populate('collectedBy', 'name role')
      .sort({ paymentDate: -1 });

    return res.json(repayments);
  } catch (error) {
    console.error('Error fetching repayments:', error);
    return res.status(500).json({ message: 'Error retrieving repayment history' });
  }
};
