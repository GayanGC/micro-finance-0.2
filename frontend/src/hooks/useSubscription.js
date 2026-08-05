import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettingsApi } from '../services/api';

export const useSubscription = () => {
  const { user } = useAuth();
  const [tenantPackage, setTenantPackage] = useState('Lite');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantSubscription();
  }, [user]);

  const fetchTenantSubscription = async () => {
    try {
      if (user?.tenantPackage) {
        setTenantPackage(user.tenantPackage);
        setLoading(false);
        return;
      }

      const settings = await getSettingsApi().catch(() => null);
      if (settings?.tenantId?.subscriptionPackage) {
        setTenantPackage(settings.tenantId.subscriptionPackage);
      } else if (settings?.subscriptionPackage) {
        setTenantPackage(settings.subscriptionPackage);
      } else {
        setTenantPackage('Lite');
      }
    } catch (err) {
      setTenantPackage('Lite');
    } finally {
      setLoading(false);
    }
  };

  const isLite = tenantPackage === 'Lite';
  const isPro = tenantPackage === 'Standard' || tenantPackage === 'Pro';
  const isEnterprise = tenantPackage === 'Premium' || tenantPackage === 'Enterprise';

  const isFeatureLocked = (featureKey) => {
    if (isLite) {
      // Lite plan locks Holiday Plan, Advanced Reports, and Multi-Branch Operations
      return ['holidays', 'reports', 'audit_export'].includes(featureKey);
    }
    return false;
  };

  return {
    tenantPackage,
    isLite,
    isPro,
    isEnterprise,
    isFeatureLocked,
    loading,
  };
};
