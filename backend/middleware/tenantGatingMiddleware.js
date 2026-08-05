import Tenant from '../models/Tenant.js';

// Tier rank hierarchy: Lite (0) < Standard / Pro (1) < Premium / Enterprise (2)
const TIER_RANK = {
  Lite: 0,
  Standard: 1,
  Pro: 1,
  Premium: 2,
  Enterprise: 2,
};

export const requireSubscriptionTier = (minTier = 'Standard') => {
  return async (req, res, next) => {
    try {
      const minRank = TIER_RANK[minTier] || 1;

      let tenantPackage = 'Lite';

      if (req.user?.tenantId) {
        const tenant = await Tenant.findById(req.user.tenantId);
        if (tenant?.subscriptionPackage) {
          tenantPackage = tenant.subscriptionPackage;
        }
      }

      const userRank = TIER_RANK[tenantPackage] || 0;

      if (userRank < minRank) {
        return res.status(403).json({
          message: `This feature is locked on your ${tenantPackage} subscription plan. Upgrade to ${minTier} or higher to unlock.`,
          subscriptionPackage: tenantPackage,
          requiredTier: minTier,
        });
      }

      next();
    } catch (error) {
      console.error('Subscription gating middleware error:', error);
      next(); // Fail open for system continuity
    }
  };
};
