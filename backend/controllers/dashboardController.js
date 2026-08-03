import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import Customer from '../models/Customer.js';

// Helper to format Month Label (e.g., 2026-08 -> "Aug 2026")
const formatMonthLabel = (year, month) => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'short' });
};

// @desc    Get Dashboard Analytics Data (Aggregated metrics & chart pipelines)
// @route   GET /api/dashboard/analytics
// @access  Private (Admin, Agent, super_admin, auditor, credit_officer)
export const getDashboardAnalytics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // ── 1. Summary Cards Aggregations ──────────────────────────────────────────
    const [
      activeLoansCount,
      overdueLoansCount,
      activeCustomersCount,
      todayCollectionAgg,
      totalDisbursedAgg,
      totalOutstandingAgg,
    ] = await Promise.all([
      Loan.countDocuments({ status: 'Active' }),
      Loan.countDocuments({ status: { $in: ['Overdue', 'Defaulted'] } }),
      Customer.countDocuments({ status: 'Active' }),
      Repayment.aggregate([
        { $match: { paymentDate: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      Loan.aggregate([
        { $group: { _id: null, total: { $sum: '$principalAmount' } } },
      ]),
      Loan.aggregate([
        { $match: { status: { $ne: 'Completed' } } },
        { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
      ]),
    ]);

    const summary = {
      activeLoans: activeLoansCount || 0,
      overdueLoans: overdueLoansCount || 0,
      activeCustomers: activeCustomersCount || 0,
      todayCollections: Math.round((todayCollectionAgg[0]?.total || 0) * 100) / 100,
      totalDisbursed: Math.round((totalDisbursedAgg[0]?.total || 0) * 100) / 100,
      totalOutstanding: Math.round((totalOutstandingAgg[0]?.total || 0) * 100) / 100,
    };

    // ── 2. Monthly Collections Trend Pipeline (Last 6 Months) ───────────────
    const collectionsAgg = await Repayment.aggregate([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
          },
          collections: { $sum: '$amountPaid' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── 3. Monthly Disbursements Trend Pipeline (Last 6 Months) ──────────────
    const disbursementsAgg = await Loan.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          disbursements: { $sum: '$principalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill in last 6 calendar months explicitly so charts are continuous
    const monthlyCollections = [];
    const monthlyDisbursements = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const label = formatMonthLabel(yr, mo);

      const collMatch = collectionsAgg.find(
        (c) => c._id.year === yr && c._id.month === mo
      );
      const disbMatch = disbursementsAgg.find(
        (b) => b._id.year === yr && b._id.month === mo
      );

      monthlyCollections.push({
        month: label,
        collections: Math.round((collMatch?.collections || 0) * 100) / 100,
      });

      monthlyDisbursements.push({
        month: label,
        disbursements: Math.round((disbMatch?.disbursements || 0) * 100) / 100,
        count: disbMatch?.count || 0,
      });
    }

    // ── 4. Loan Status Distribution Pipeline ──────────────────────────────────
    const statusAgg = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = { Active: 0, Completed: 0, Overdue: 0, Pending: 0, Defaulted: 0 };
    statusAgg.forEach((s) => {
      if (s._id && statusMap[s._id] !== undefined) {
        statusMap[s._id] = s.count;
      }
    });

    const statusDistribution = [
      { name: 'Active', value: statusMap.Active, color: '#10B981' },       // Emerald
      { name: 'Completed', value: statusMap.Completed, color: '#4F46E5' }, // Indigo
      { name: 'Overdue', value: statusMap.Overdue, color: '#F59E0B' },     // Amber
      { name: 'Pending', value: statusMap.Pending, color: '#3B82F6' },     // Blue
      { name: 'Defaulted', value: statusMap.Defaulted, color: '#EF4444' }, // Red
    ].filter((item) => item.value > 0 || statusAgg.length === 0); // Keep nonzero items or default

    return res.json({
      summary,
      monthlyCollections,
      monthlyDisbursements,
      statusDistribution,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[DashboardAnalytics] Error:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard analytics', error: error.message });
  }
};
