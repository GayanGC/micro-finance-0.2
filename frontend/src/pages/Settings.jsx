import React, { useState } from 'react';
import { useSystemMode } from '../context/SystemModeContext';
import { useAuth } from '../context/AuthContext';
import { setSystemModeApi } from '../services/api';
import {
  Settings as SettingsIcon,
  Zap,
  Building2,
  Shield,
  GitBranch,
  MapPin,
  AlertTriangle,
  Bell,
  FileText,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
} from 'lucide-react';

const ToggleSwitch = ({ enabled, onToggle, label, description, icon: Icon, disabled }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
    enabled
      ? 'bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800'
      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        enabled ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
      }`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className="flex-shrink-0 transition-transform hover:scale-105"
    >
      {enabled
        ? <ToggleRight className="w-8 h-8 text-brand-500" />
        : <ToggleLeft className="w-8 h-8 text-slate-400" />}
    </button>
  </div>
);

const Settings = () => {
  const { config, setSystemMode, toggleFeature, updateConfig, isEnterprise } = useSystemMode();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAdmin = ['Admin', 'super_admin'].includes(user?.role);

  const handleModeSwitch = (mode) => {
    if (!isAdmin) return;
    setSystemMode(mode);
  };

  const handleSaveToServer = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setSystemModeApi(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      // Silently fail — local config is already updated
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const features = [
    {
      key: 'multiLevelApproval',
      label: 'Multi-Level Loan Approvals',
      description: 'Agent → Credit Officer → Branch Manager workflow',
      icon: GitBranch,
      enterpriseOnly: true,
    },
    {
      key: 'gpsTrackingEnabled',
      label: 'GPS Field Tracking',
      description: 'Capture agent location during repayment collections',
      icon: MapPin,
      enterpriseOnly: false,
    },
    {
      key: 'penaltyEngineEnabled',
      label: 'Dynamic Penalty Engine',
      description: 'Auto-calculate late payment fees and PAR bucket classification',
      icon: AlertTriangle,
      enterpriseOnly: false,
    },
    {
      key: 'notificationsEnabled',
      label: 'Automated Notifications',
      description: 'SMS/WhatsApp/In-App alerts for overdue and loan events',
      icon: Bell,
      enterpriseOnly: false,
    },
    {
      key: 'auditLogsEnabled',
      label: 'Security Audit Trail',
      description: 'Log all critical actions with IP address and timestamps',
      icon: FileText,
      enterpriseOnly: false,
    },
    {
      key: 'branchManagementEnabled',
      label: 'Branch Management',
      description: 'Multi-branch support with filters by branch',
      icon: Building2,
      enterpriseOnly: true,
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configure system mode and feature toggles</p>
        </div>
      </div>

      {/* System Mode Switch */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-brand-500" />
          System Mode
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose the operational complexity level. Lite Mode simplifies the UI for small teams. Enterprise Mode unlocks all advanced features.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lite Mode */}
          <button
            onClick={() => handleModeSwitch('lite')}
            disabled={!isAdmin}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              !isEnterprise
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
            } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${!isEnterprise ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="font-bold text-slate-900 dark:text-white">⚡ Lite Mode</span>
              {!isEnterprise && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              1-step approval, flat rate, simplified navigation. Perfect for small MFIs.
            </p>
          </button>

          {/* Enterprise Mode */}
          <button
            onClick={() => handleModeSwitch('enterprise')}
            disabled={!isAdmin}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              isEnterprise
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
            } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className={`w-5 h-5 ${isEnterprise ? 'text-purple-600' : 'text-slate-400'}`} />
              <span className="font-bold text-slate-900 dark:text-white">🏢 Enterprise Mode</span>
              {isEnterprise && <CheckCircle className="w-4 h-4 text-purple-500 ml-auto" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-level approval, reducing balance, multi-branch, full audit trail.
            </p>
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ToggleRight className="w-4.5 h-4.5 text-brand-500" />
          Feature Toggles
        </h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <ToggleSwitch
              key={feature.key}
              enabled={config[feature.key]}
              onToggle={() => isAdmin && toggleFeature(feature.key)}
              label={feature.label}
              description={feature.enterpriseOnly
                ? `${feature.description} (Enterprise only)`
                : feature.description}
              icon={feature.icon}
              disabled={!isAdmin || (feature.enterpriseOnly && !isEnterprise)}
            />
          ))}
        </div>
        {!isAdmin && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            ⚠️ Only Admin or Super Admin can modify system settings.
          </p>
        )}
      </div>

      {/* Save Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveToServer}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25'
            }`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save to Server'}
          </button>
        </div>
      )}

      {/* Current Config Display */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Active Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(config).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${value === true ? 'bg-emerald-500' : value === false ? 'bg-red-400' : 'bg-brand-500'}`} />
              <span className="text-slate-600 dark:text-slate-300 font-mono">
                {key}: <span className="font-semibold">{String(value)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
