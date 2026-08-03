import Repayment from '../models/Repayment.js';
import Loan from '../models/Loan.js';
import Customer from '../models/Customer.js';
import { computePenalty } from '../utils/penaltyEngine.js';
import { triggerNotification } from '../utils/notificationScheduler.js';

// @desc    Submit a Repayment & deduct from Loan remaining balance
// @route   POST /api/repayments/add
// @access  Private (Admin & Agent)
export const addRepayment = async (req, res) => {
  try {
    const {
      loanId,
      amountPaid,
      paymentMethod,
      gpsLocation,
      chequeNumber,
      chequeStatus,
      notes,
      paymentDate,
    } = req.body;

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

    // Compute penalty info
    const effectivePaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    const penaltyInfo = computePenalty(loan, effectivePaymentDate);

    const payAmount = Number(amountPaid);
    const penaltyPaid = Math.min(payAmount * 0.1, penaltyInfo.penaltyAmount); // Penalty portion of payment
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
      paymentDate: effectivePaymentDate,
      gpsLocation: gpsLocation || null,
      isOnlinePayment: paymentMethod === 'Online Gateway',
      penaltyPaid: penaltyPaid > 0 ? penaltyPaid : 0,
      chequeNumber: chequeNumber || '',
      chequeStatus: paymentMethod === 'Cheque' ? (chequeStatus || 'Pending') : 'N/A',
      notes: notes || '',
    });

    // Update Loan remaining balance & status automatically
    loan.remainingBalance = newBalance;
    loan.lastPaymentDate = effectivePaymentDate;
    loan.overdueDays = penaltyInfo.overdueDays;
    loan.parBucket = penaltyInfo.parBucket;

    // Recalculate next due date (30 days from payment)
    const nextDue = new Date(effectivePaymentDate);
    nextDue.setDate(nextDue.getDate() + 30);
    loan.nextDueDate = nextDue;

    if (newBalance <= 0) {
      loan.status = 'Completed';
    }
    await loan.save();

    // Trigger payment notification
    await triggerNotification('payment_received', {
      loanId: loan._id,
      customerId: loan.customer._id,
      metadata: { amountPaid: payAmount, receiptNumber },
    });

    if (newBalance <= 0) {
      await triggerNotification('loan_completed', {
        loanId: loan._id,
        customerId: loan.customer._id,
        metadata: { completedAt: new Date() },
      });
    }

    const populatedRepayment = await Repayment.findById(repayment._id)
      .populate('customerId', 'fullName phone nicNumber address')
      .populate('loanId', 'principalAmount remainingBalance monthlyInstallment')
      .populate('collectedBy', 'name role');

    return res.status(201).json({
      message: newBalance === 0 ? 'Repayment logged! Loan is now FULLY COMPLETED!' : 'Repayment recorded successfully!',
      repayment: populatedRepayment,
      loanCompleted: newBalance === 0,
      penaltyInfo,
    });
  } catch (error) {
    console.error('Error recording repayment:', error);
    return res.status(500).json({ message: 'Failed to record repayment', error: error.message });
  }
};

// @desc    Simulate Online EMI Payment (Customer self-service)
// @route   POST /api/repayments/online
// @access  Private (Customer, Admin)
export const onlinePayment = async (req, res) => {
  try {
    const { loanId, amountPaid } = req.body;

    if (!loanId || !amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ message: 'Please provide a valid loan ID and positive payment amount.' });
    }

    const loan = await Loan.findById(loanId).populate('customer');
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found.' });
    }

    if (loan.status === 'Completed') {
      return res.status(400).json({ message: 'This loan has already been fully paid.' });
    }

    const payAmount = Number(amountPaid);
    const newBalance = Math.max(0, Math.round((loan.remainingBalance - payAmount) * 100) / 100);

    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `ONL-${dateCode}-${randomSuffix}`;

    const repayment = await Repayment.create({
      loanId: loan._id,
      customerId: loan.customer._id,
      amountPaid: payAmount,
      paymentMethod: 'Online Gateway',
      collectedBy: req.user._id,
      receiptNumber,
      newRemainingBalance: newBalance,
      isOnlinePayment: true,
      notes: 'Customer self-service online payment',
    });

    loan.remainingBalance = newBalance;
    loan.lastPaymentDate = new Date();
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30);
    loan.nextDueDate = nextDue;
    if (newBalance <= 0) loan.status = 'Completed';
    await loan.save();

    await triggerNotification('payment_received', {
      loanId: loan._id,
      customerId: loan.customer._id,
      metadata: { amountPaid: payAmount, receiptNumber, channel: 'Online' },
    });

    return res.status(201).json({
      message: 'Online payment processed successfully!',
      receiptNumber,
      amountPaid: payAmount,
      newRemainingBalance: newBalance,
      loanCompleted: newBalance === 0,
    });
  } catch (error) {
    console.error('Error processing online payment:', error);
    return res.status(500).json({ message: 'Online payment failed', error: error.message });
  }
};

// @desc    Get Repayment transaction ledger
// @route   GET /api/repayments
// @access  Private
export const getRepayments = async (req, res) => {
  try {
    let filter = {};
    const { paymentMethod, isOnline, loanId: qLoanId } = req.query;

    // Filter by Customer if logged in as Customer
    if (req.user.role === 'Customer') {
      const customerRecord = await Customer.findOne({
        $or: [{ phone: req.user.phone }, { email: req.user.email }],
      });
      if (customerRecord) {
        filter.customerId = customerRecord._id;
      }
    }

    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (isOnline === 'true') filter.isOnlinePayment = true;
    if (qLoanId) filter.loanId = qLoanId;

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
// @desc    Bulk Repayment — Process payments for multiple loans at once (Center/Group collection)
// @route   POST /api/repayments/bulk
// @access  Private (Admin, Agent, super_admin)
export const bulkRepayment = async (req, res) => {
  try {
    const { payments, paymentDate, paymentMethod, notes } = req.body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: 'Please provide a non-empty payments array.' });
    }

    const effectiveDate = paymentDate ? new Date(paymentDate) : new Date();
    const dateCode = effectiveDate.toISOString().slice(0, 10).replace(/-/g, '');

    // Process all payments concurrently using Promise.allSettled for resilience
    const results = await Promise.allSettled(
      payments.map(async (entry, index) => {
        const { loanId, amount, note } = entry;
        const payAmount = Number(amount);

        if (!loanId || !payAmount || payAmount <= 0) {
          throw new Error(`Entry ${index + 1}: Invalid loanId or amount.`);
        }

        const loan = await Loan.findById(loanId).populate('customer');
        if (!loan) {
          throw new Error(`Entry ${index + 1}: Loan ${loanId} not found.`);
        }

        if (loan.status === 'Completed') {
          throw new Error(`Entry ${index + 1}: Loan ${loanId} is already completed.`);
        }

        const penaltyInfo = computePenalty(loan, effectiveDate);
        const penaltyPaid = Math.min(payAmount * 0.1, penaltyInfo.penaltyAmount);
        const newBalance = Math.max(0, Math.round((loan.remainingBalance - payAmount) * 100) / 100);

        // Generate unique bulk receipt number
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const receiptNumber = `BLK-${dateCode}-${index + 1}-${randomSuffix}`;

        const repayment = await Repayment.create({
          loanId: loan._id,
          customerId: loan.customer._id,
          amountPaid: payAmount,
          paymentMethod: paymentMethod || 'Cash',
          collectedBy: req.user._id,
          receiptNumber,
          newRemainingBalance: newBalance,
          paymentDate: effectiveDate,
          penaltyPaid: penaltyPaid > 0 ? penaltyPaid : 0,
          notes: note || notes || 'Bulk collection',
        });

        // Update loan
        loan.remainingBalance = newBalance;
        loan.lastPaymentDate = effectiveDate;
        loan.overdueDays = penaltyInfo.overdueDays;
        loan.parBucket = penaltyInfo.parBucket;

        const nextDue = new Date(effectiveDate);
        nextDue.setDate(nextDue.getDate() + 30);
        loan.nextDueDate = nextDue;

        if (newBalance <= 0) {
          loan.status = 'Completed';
        }
        await loan.save();

        // Fire notifications (non-blocking)
        triggerNotification('payment_received', {
          loanId: loan._id,
          customerId: loan.customer._id,
          metadata: { amountPaid: payAmount, receiptNumber, bulk: true },
        }).catch(() => {});

        if (newBalance <= 0) {
          triggerNotification('loan_completed', {
            loanId: loan._id,
            customerId: loan.customer._id,
            metadata: { completedAt: new Date() },
          }).catch(() => {});
        }

        return {
          loanId: String(loan._id),
          customerName: loan.customer?.fullName || 'Unknown',
          amountPaid: payAmount,
          newRemainingBalance: newBalance,
          receiptNumber,
          loanCompleted: newBalance <= 0,
        };
      })
    );

    // Separate successes from failures
    const succeeded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r) => ({ error: r.reason?.message || 'Unknown error' }));

    return res.status(201).json({
      message: `Bulk collection processed: ${succeeded.length} succeeded, ${failed.length} failed.`,
      totalProcessed: payments.length,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('Error processing bulk repayment:', error);
    return res.status(500).json({ message: 'Failed to process bulk collection', error: error.message });
  }
};
