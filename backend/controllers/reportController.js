import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import Customer from '../models/Customer.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildDateFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the full end day
      filter[field].$lte = end;
    }
  }
  return filter;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Loan Portfolio Summary Report
 * @route   GET /api/reports/loans
 * @access  Private (Admin, super_admin, auditor)
 */
export const getLoanReport = async (req, res) => {
  try {
    const { startDate, endDate, status, branch } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, 'createdAt');
    const filter = { ...dateFilter };
    if (status) filter.status = status;

    const loans = await Loan.find(filter)
      .populate('customer', 'fullName phone nicNumber branch center group')
      .populate('policy', 'name interestRate durationMonths interestType')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    // Apply branch filter (on populated customer)
    const filteredLoans = branch
      ? loans.filter((l) => l.customer?.branch === branch)
      : loans;

    // Aggregate summary
    const summary = filteredLoans.reduce(
      (acc, loan) => {
        acc.totalLoans += 1;
        acc.totalDisbursed += loan.principalAmount || 0;
        acc.totalInterest += loan.totalInterest || 0;
        acc.totalPayable += loan.totalPayable || 0;
        acc.totalOutstanding += loan.remainingBalance || 0;
        acc.totalCollected += (loan.totalPayable - loan.remainingBalance) || 0;

        if (loan.status === 'Active') acc.activeCount += 1;
        if (loan.status === 'Completed') acc.completedCount += 1;
        if (loan.status === 'Overdue') acc.overdueCount += 1;
        if (loan.status === 'Defaulted') acc.defaultedCount += 1;
        if (loan.status === 'Pending') acc.pendingCount += 1;

        return acc;
      },
      {
        totalLoans: 0,
        activeCount: 0,
        completedCount: 0,
        overdueCount: 0,
        defaultedCount: 0,
        pendingCount: 0,
        totalDisbursed: 0,
        totalInterest: 0,
        totalPayable: 0,
        totalOutstanding: 0,
        totalCollected: 0,
      }
    );

    // Round all summary values to 2dp
    Object.keys(summary).forEach((k) => {
      if (typeof summary[k] === 'number') {
        summary[k] = Math.round(summary[k] * 100) / 100;
      }
    });

    return res.json({ summary, loans: filteredLoans });
  } catch (error) {
    console.error('[reportController] getLoanReport error:', error);
    return res.status(500).json({ message: 'Failed to generate loan report', error: error.message });
  }
};

/**
 * @desc    Collections / Repayments Report
 * @route   GET /api/reports/collections
 * @access  Private (Admin, super_admin, auditor)
 */
export const getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, 'paymentDate');
    const filter = { ...dateFilter };
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const repayments = await Repayment.find(filter)
      .populate('customerId', 'fullName phone nicNumber branch center group')
      .populate('loanId', 'principalAmount remainingBalance monthlyInstallment status')
      .populate('collectedBy', 'name role')
      .sort({ paymentDate: -1 })
      .lean();

    const summary = repayments.reduce(
      (acc, r) => {
        acc.totalTransactions += 1;
        acc.totalCollected += r.amountPaid || 0;
        acc.totalPenaltyCollected += r.penaltyPaid || 0;
        const method = r.paymentMethod || 'Cash';
        acc.byMethod[method] = (acc.byMethod[method] || 0) + (r.amountPaid || 0);
        return acc;
      },
      { totalTransactions: 0, totalCollected: 0, totalPenaltyCollected: 0, byMethod: {} }
    );

    summary.totalCollected = Math.round(summary.totalCollected * 100) / 100;
    summary.totalPenaltyCollected = Math.round(summary.totalPenaltyCollected * 100) / 100;

    return res.json({ summary, repayments });
  } catch (error) {
    console.error('[reportController] getCollectionReport error:', error);
    return res.status(500).json({ message: 'Failed to generate collection report', error: error.message });
  }
};

/**
 * @desc    Outstanding Balance Report (snapshot of active loans)
 * @route   GET /api/reports/outstanding
 * @access  Private (Admin, super_admin, auditor)
 */
export const getOutstandingReport = async (req, res) => {
  try {
    const { branch, center, parBucket } = req.query;
    const filter = { status: { $in: ['Active', 'Overdue', 'Defaulted'] } };
    if (parBucket) filter.parBucket = parBucket;

    const loans = await Loan.find(filter)
      .populate('customer', 'fullName phone nicNumber branch center group creditScore riskTag')
      .populate('policy', 'name interestRate durationMonths')
      .sort({ remainingBalance: -1 })
      .lean();

    const filtered = loans.filter((l) => {
      if (branch && l.customer?.branch !== branch) return false;
      if (center && l.customer?.center !== center) return false;
      return true;
    });

    const summary = filtered.reduce(
      (acc, loan) => {
        acc.totalLoans += 1;
        acc.totalOutstanding += loan.remainingBalance || 0;
        acc.totalDisbursed += loan.principalAmount || 0;
        const par = loan.parBucket || 'Current';
        acc.parBreakdown[par] = (acc.parBreakdown[par] || 0) + (loan.remainingBalance || 0);
        return acc;
      },
      { totalLoans: 0, totalOutstanding: 0, totalDisbursed: 0, parBreakdown: {} }
    );

    summary.totalOutstanding = Math.round(summary.totalOutstanding * 100) / 100;
    summary.totalDisbursed = Math.round(summary.totalDisbursed * 100) / 100;
    Object.keys(summary.parBreakdown).forEach((k) => {
      summary.parBreakdown[k] = Math.round(summary.parBreakdown[k] * 100) / 100;
    });

    return res.json({ summary, loans: filtered });
  } catch (error) {
    console.error('[reportController] getOutstandingReport error:', error);
    return res.status(500).json({ message: 'Failed to generate outstanding report', error: error.message });
  }
};

/**
 * @desc    Profit & Loss Summary
 * @route   GET /api/reports/pnl
 * @access  Private (Admin, super_admin, auditor)
 */
export const getPnLReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, 'paymentDate');

    const [repayments, loans] = await Promise.all([
      Repayment.find(dateFilter).lean(),
      Loan.find(buildDateFilter(startDate, endDate, 'createdAt')).lean(),
    ]);

    const totalDisbursed = loans.reduce((s, l) => s + (l.principalAmount || 0), 0);
    const totalInterestExpected = loans.reduce((s, l) => s + (l.totalInterest || 0), 0);
    const totalCollected = repayments.reduce((s, r) => s + (r.amountPaid || 0), 0);
    const totalPenalty = repayments.reduce((s, r) => s + (r.penaltyPaid || 0), 0);
    const totalOutstanding = loans.reduce((s, l) => s + (l.remainingBalance || 0), 0);

    // Simplified P&L: Interest collected = total collected - principal recovered portion
    const principalRecovered = totalCollected > totalOutstanding
      ? totalDisbursed - totalOutstanding
      : totalCollected * (totalDisbursed / (totalDisbursed + totalInterestExpected || 1));

    const interestIncome = Math.max(0, totalCollected - principalRecovered);

    const pnl = {
      period: {
        from: startDate || 'All time',
        to: endDate || new Date().toISOString().split('T')[0],
      },
      totalLoansDisbursed: loans.length,
      totalDisbursed: Math.round(totalDisbursed * 100) / 100,
      totalInterestExpected: Math.round(totalInterestExpected * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalPenaltyIncome: Math.round(totalPenalty * 100) / 100,
      estimatedInterestIncome: Math.round(interestIncome * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      netIncome: Math.round((interestIncome + totalPenalty) * 100) / 100,
    };

    return res.json(pnl);
  } catch (error) {
    console.error('[reportController] getPnLReport error:', error);
    return res.status(500).json({ message: 'Failed to generate P&L report', error: error.message });
  }
};
