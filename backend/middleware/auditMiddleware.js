import AuditLog from '../models/AuditLog.js';

/**
 * Middleware factory for audit logging
 * Usage: router.post('/loans', protect, auditLog('CREATE', 'Loan'), createLoan);
 *
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, APPROVE, etc.)
 * @param {string} entity - Entity being affected (Loan, Customer, etc.)
 */
export const auditLog = (action, entity) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Only log on success responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const ipAddress =
            req.headers['x-forwarded-for'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            '';

          const entityId =
            data?._id ||
            data?.loan?._id ||
            data?.customer?._id ||
            data?.repayment?._id ||
            req.params?.id ||
            '';

          await AuditLog.create({
            user: req.user?._id || null,
            userName: req.user?.name || 'System',
            userRole: req.user?.role || '',
            action,
            entity,
            entityId: String(entityId),
            description: `${action} on ${entity} by ${req.user?.name || 'System'}`,
            newValues: data,
            ipAddress: String(ipAddress).split(',')[0].trim(),
            userAgent: req.headers['user-agent'] || '',
            timestamp: new Date(),
          });
        } catch (logError) {
          // Never block the response due to audit log failure
          console.error('[AuditLog] Failed to write audit entry:', logError.message);
        }
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Standalone function to manually write an audit log entry
 * Useful for login/logout and non-middleware scenarios.
 */
export const writeAuditLog = async ({
  userId = null,
  userName = 'System',
  userRole = '',
  action,
  entity,
  entityId = '',
  description = '',
  oldValues = null,
  newValues = null,
  ipAddress = '',
  userAgent = '',
}) => {
  try {
    await AuditLog.create({
      user: userId,
      userName,
      userRole,
      action,
      entity,
      entityId: String(entityId),
      description,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[AuditLog] writeAuditLog failed:', error.message);
  }
};
