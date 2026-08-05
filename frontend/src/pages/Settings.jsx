import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettingsApi, updateSettingsApi, exportBackupApi } from '../services/api';
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Building2,
  Image as ImageIcon,
  Database,
  Download,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Key,
  DollarSign,
  FileText,
  Lock,
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [activeTab, setActiveTab] = useState('localization'); // 'localization' | 'profile' | 'letterhead' | 'signatures' | 'database'
  const [toast, setToast] = useState({ type: '', text: '' });

  // Settings State
  const [settings, setSettings] = useState({
    currencySymbol: '$',
    currencyCode: 'USD',
    systemName: 'Microfinance Core Banking v2.0',
    companyName: 'Microfinance Core Banking System',
    companyAddress: '123 Financial District, Suite 400',
    contactEmail: 'support@microfinance.com',
    contactPhone: '+94 11 234 5678',
    logoUrl: '',
    directorSignatureUrl: '',
    companySealUrl: '',
  });

  const showToastMsg = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const fetchSettingsData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettingsApi();
      setSettings(data || {});
    } catch (err) {
      console.error('Error fetching settings:', err);
      showToastMsg('error', 'Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  // Handle Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsApi(settings);
      showToastMsg('success', res.message || 'Settings and letterhead updated successfully!');
      fetchSettingsData();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Database Backup Export
  const handleDownloadBackup = async () => {
    setBackingUp(true);
    try {
      const backupData = await exportBackupApi();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Microfinance_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToastMsg('success', 'Database backup downloaded successfully!');
    } catch (err) {
      console.error('Backup failed:', err);
      showToastMsg('error', 'Failed to download database backup.');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Toast Alert */}
      {toast.text && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border transition ${
            toast.type === 'error'
              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-brand-500" />
            Global Settings &amp; PDF Letterhead Module
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system localization, currency symbols, company letterhead, and document signature stamps.
          </p>
        </div>

        <button
          onClick={fetchSettingsData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        {[
          { id: 'localization', label: 'Localization & Currency', icon: Globe },
          { id: 'letterhead', label: 'Company Letterhead', icon: Building2 },
          { id: 'signatures', label: 'Signatures & Seals', icon: ImageIcon },
          { id: 'profile', label: 'My User Profile', icon: User },
          { id: 'database', label: 'Database Backup', icon: Database },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ── TAB 1: LOCALIZATION & CURRENCY ────────────────────────────────── */}
        {activeTab === 'localization' && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Globe className="w-5 h-5 text-brand-500" />
              Localization &amp; Currency Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">
                  Currency Symbol (e.g. $, LKR, Rs., ₹, €, £) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  placeholder="e.g. $ or LKR or Rs."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used across loan balance ledgers, reports, and PDF receipt vouchers.</p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">
                  ISO Currency Code (e.g. USD, LKR, INR, EUR) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.currencyCode}
                  onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                  placeholder="e.g. USD"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: COMPANY LETTERHEAD ─────────────────────────────────────── */}
        {activeTab === 'letterhead' && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-brand-500" />
              Company Letterhead &amp; Document Header
            </h2>

            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Company / Organization Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="e.g. Lanka Micro Capital (Pvt) Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">System Header Title</label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                    placeholder="e.g. Microfinance Core Banking v2.0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Company Physical Address (Appears on PDFs)</label>
                <input
                  type="text"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  placeholder="e.g. 123 Financial District, Suite 400, Colombo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Support Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    placeholder="info@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Contact Telephone Number</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    placeholder="+94 11 234 5678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: SIGNATURES & SEALS ──────────────────────────────────────── */}
        {activeTab === 'signatures' && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <ImageIcon className="w-5 h-5 text-brand-500" />
              Director Signatures &amp; Official Company Seal (PDF Vouchers)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-medium">
              {/* Director Signature */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <label className="block text-slate-700 dark:text-slate-200 font-bold">
                  Authorized Director Signature (Image URL or Base64)
                </label>
                <input
                  type="text"
                  value={settings.directorSignatureUrl}
                  onChange={(e) => setSettings({ ...settings, directorSignatureUrl: e.target.value })}
                  placeholder="https://example.com/signature.png"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">Embeds at bottom of generated A5 PDF receipt vouchers.</p>

                {/* Preview Box */}
                <div className="h-20 w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden">
                  {settings.directorSignatureUrl ? (
                    <img src={settings.directorSignatureUrl} alt="Director Signature" className="h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400">No signature image set</span>
                  )}
                </div>
              </div>

              {/* Company Seal */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <label className="block text-slate-700 dark:text-slate-200 font-bold">
                  Official Company Stamp / Seal (Image URL or Base64)
                </label>
                <input
                  type="text"
                  value={settings.companySealUrl}
                  onChange={(e) => setSettings({ ...settings, companySealUrl: e.target.value })}
                  placeholder="https://example.com/seal.png"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">Official stamp watermark on payment receipts.</p>

                {/* Preview Box */}
                <div className="h-20 w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden">
                  {settings.companySealUrl ? (
                    <img src={settings.companySealUrl} alt="Company Seal" className="h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400">No company seal set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: USER PROFILE ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <User className="w-5 h-5 text-brand-500" />
              User Profile &amp; Credentials
            </h2>

            <div className="space-y-4 text-xs font-medium max-w-lg">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || 'Administrator'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Email Identifier</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || 'admin@microfinance.com'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Role Permission</label>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 inline-block">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: DATABASE BACKUP ────────────────────────────────────────── */}
        {activeTab === 'database' && (
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Database className="w-5 h-5 text-brand-500" />
              Database Backup &amp; System Export
            </h2>

            <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export Full Database Backup</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Download a complete JSON snapshot of Customers, Loans, and Repayments.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={backingUp}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-lg shadow-brand-500/25 flex items-center gap-2"
              >
                {backingUp ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download Database Backup (.json)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Save Button Bar */}
        {activeTab !== 'database' && activeTab !== 'profile' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-lg shadow-brand-500/25 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings &amp; Letterhead</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
