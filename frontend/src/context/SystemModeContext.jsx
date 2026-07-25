import React, { createContext, useContext, useEffect, useState } from 'react';

const SystemModeContext = createContext();

const DEFAULT_CONFIG = {
  systemMode: 'lite',     // 'lite' | 'enterprise'
  multiLevelApproval: false,
  gpsTrackingEnabled: true,
  penaltyEngineEnabled: true,
  notificationsEnabled: true,
  auditLogsEnabled: true,
  branchManagementEnabled: false,
};

export const SystemModeProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_system_config');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (_) {}
    return { ...DEFAULT_CONFIG };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('mf_system_config', JSON.stringify(config));
  }, [config]);

  const setSystemMode = (mode) => {
    setConfig((prev) => ({
      ...prev,
      systemMode: mode,
      multiLevelApproval: mode === 'enterprise',
      branchManagementEnabled: mode === 'enterprise',
    }));
  };

  const toggleFeature = (feature) => {
    setConfig((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const updateConfig = (updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const isEnterprise = config.systemMode === 'enterprise';
  const isLite = config.systemMode === 'lite';

  return (
    <SystemModeContext.Provider
      value={{
        config,
        setSystemMode,
        toggleFeature,
        updateConfig,
        isEnterprise,
        isLite,
        loading,
        setLoading,
      }}
    >
      {children}
    </SystemModeContext.Provider>
  );
};

export const useSystemMode = () => {
  const context = useContext(SystemModeContext);
  if (!context) {
    throw new Error('useSystemMode must be used within a SystemModeProvider');
  }
  return context;
};
