import React, { useState, useEffect, useCallback } from 'react';
import {
  getTenantsApi,
  createTenantApi,
  updateTenantApi,
  deleteTenantApi,
} from '../../services/api';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const PKG_BADGES = {
  Lite: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Standard: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Premium: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

const STATUS_BADGES = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Expired: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
};

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toast, setToast] = useState({ type: '', text: '' });

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    companyName: '',
    adminEmail: '',
    contactNumber: '',
    subscriptionPackage: 'Lite',
    subscriptionStatus: 'Active',
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    monthlyFee: '49',
    maxUsers: '10',
    maxLoans: '200',
    notes: '',
  });

  const showToastMsg = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTenantsApi();
      setTenants(res.tenants || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      showToastMsg('error', 'Failed to load tenant subscriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Handle Package Selection Change (Auto-suggest fee & quotas)
  const handlePackageChange = (pkg) => {
    const feeMap = { Lite: '49', Standard: '149', Premium: '299' };
    const userMap = { Lite: '10', Standard: '25', Premium: '100' };
    const loanMap = { Lite: '200', Standard: '1000', Premium: '5000' };

    setForm((prev) => ({
      ...prev,
      subscriptionPackage: pkg,
      monthlyFee: feeMap[pkg] || '49',
      maxUsers: userMap[pkg] || '10',
      maxLoans: loanMap[pkg] || '200',
    }));
  };

  // Add / Edit Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.adminEmail || !form.contactNumber) {
      showToastMsg('error', 'Company name, admin email, and contact number are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTenant) {
        await updateTenantApi(editingTenant._id, form);
        showToastMsg('success', 'Tenant subscription updated successfully!');
      } else {
        await createTenantApi(form);
        showToastMsg('success', 'New tenant organization registered successfully!');
      }
      setShowAddModal(false);
      setEditingTenant(null);
      resetForm();
      fetchTenants();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Start Edit
  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setForm({
      companyName: tenant.companyName || '',
      adminEmail: tenant.adminEmail || '',
      contactNumber: tenant.contactNumber || '',
      subscriptionPackage: tenant.subscriptionPackage || 'Lite',
      subscriptionStatus: tenant.subscriptionStatus || 'Active',
      subscriptionExpiry: tenant.subscriptionExpiry
        ? new Date(tenant.subscriptionExpiry).toISOString().slice(0, 10)
        : '',
      monthlyFee: String(tenant.monthlyFee || 0),
      maxUsers: String(tenant.maxUsers || 10),
      maxLoans: String(tenant.maxLoans || 200),
      notes: tenant.notes || '',
    });
    setShowAddModal(true);
  };

  // Delete Tenant
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${name}"?`)) return;
    try {
      await deleteTenantApi(id);
      showToastMsg('success', `Tenant "${name}" deleted.`);
      fetchTenants();
    } catch (err) {
      showToastMsg('error', 'Failed to delete tenant.');
    }
  };

  const resetForm = () => {
    setForm({
      companyName: '',
      adminEmail: '',
      contactNumber: '',
      subscriptionPackage: 'Lite',
      subscriptionStatus: 'Active',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      monthlyFee: '49',
      maxUsers: '10',
      maxLoans: '200',
      notes: '',
    });
  };

  // Filter Tenants
  const filteredTenants = tenants.filter((t) => {
    const matchPkg = filterPackage === 'ALL' || t.subscriptionPackage === filterPackage;
    const matchStatus = filterStatus === 'ALL' || t.subscriptionStatus === filterStatus;
    const matchSearch =
      t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contactNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPkg && matchStatus && matchSearch;
  });

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-purple-500" />
            Tenant Organizations &amp; Subscription Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register new microfinance companies, assign subscription tiers, and manage expiry dates.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTenant(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-500/25 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Register New Tenant
        </button>
      </div>

      {/* Controls: Filters & Search */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Tier:
            </span>
            {['ALL', 'Lite', 'Standard', 'Premium'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPackage(p)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  filterPackage === p
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            ))}

            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">Status:</span>
            {['ALL', 'Active', 'Suspended', 'Expired'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  filterStatus === s
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company or email..."
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Tenant Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Organization</th>
                <th className="px-4 py-3">Admin Email</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Package Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Monthly Fee</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTenants.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    {t.companyName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{t.adminEmail}</td>
                  <td className="px-4 py-3.5 text-slate-500">{t.contactNumber}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${PKG_BADGES[t.subscriptionPackage] || PKG_BADGES.Lite}`}>
                      {t.subscriptionPackage}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${STATUS_BADGES[t.subscriptionStatus] || STATUS_BADGES.Active}`}>
                      {t.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-medium">{fmtDate(t.subscriptionExpiry)}</td>
                  <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white">${fmt(t.monthlyFee)}/mo</td>
                  <td className="px-4 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                      title="Edit Subscription"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id, t.companyName)}
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                      title="Delete Tenant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">
                    No matching tenant organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: ADD / EDIT TENANT ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                {editingTenant ? 'Edit Tenant Subscription' : 'Register New SaaS Tenant Company'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Lanka Micro Capital Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    placeholder="+94 77 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold text-purple-600 dark:text-purple-400">Subscription Package Tier</label>
                  <select
                    value={form.subscriptionPackage}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  >
                    <option value="Lite">Lite Tier ($49/mo)</option>
                    <option value="Standard">Standard Tier ($149/mo)</option>
                    <option value="Premium">Premium Enterprise ($299/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Subscription Status</label>
                  <select
                    value={form.subscriptionStatus}
                    onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Active">Active 🟢</option>
                    <option value="Suspended">Suspended 🟠</option>
                    <option value="Expired">Expired 🔴</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={form.subscriptionExpiry}
                    onChange={(e) => setForm({ ...form, subscriptionExpiry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Monthly Recurring Fee ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.monthlyFee}
                    onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Notes / Internal Remarks (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Special SLA agreement"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingTenant ? 'Save Changes' : 'Register Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
