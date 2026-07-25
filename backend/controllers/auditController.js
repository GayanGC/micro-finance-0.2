import AuditLog from '../models/AuditLog.js';

// @desc    Get paginated audit logs
// @route   GET /api/audit
// @access  Private (Admin, super_admin, auditor)
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entity,
      userId,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (userId) filter.user = userId;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .populate('user', 'name role email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ message: 'Error retrieving audit logs', error: error.message });
  }
};

// @desc    Get audit log summary stats
// @route   GET /api/audit/stats
// @access  Private (Admin, super_admin, auditor)
export const getAuditStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, actionBreakdown, entityBreakdown] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ timestamp: { $gte: today } }),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      totalLogs,
      todayLogs,
      actionBreakdown,
      entityBreakdown,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving audit stats' });
  }
};
