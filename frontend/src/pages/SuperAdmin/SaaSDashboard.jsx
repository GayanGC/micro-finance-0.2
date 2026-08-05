import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenantsApi } from '../../services/api';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Shield,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Crown,
  Zap,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

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

const SaaSDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ tenants: [], summary: null });
  const [loading, setLoading] = useState(true);

  const fetchSaaSData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTenantsApi();
      setData(res);
    } catch (err) {
      console.error('Error fetching SaaS dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaaSData();
  }, [fetchSaaSData]);

  const tenants = data.tenants || [];
  const summary = data.summary || {
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    expiredTenants: 0,
    monthlyRecurringRevenue: 0,
    packageBreakdown: { Lite: 0, Standard: 0, Premium: 0 },
  };

  const packageChartData = [
    { name: 'Lite ($49/mo)', value: summary.packageBreakdown?.Lite || 0, color: '#10B981' },
    { name: 'Standard ($149/mo)', value: summary.packageBreakdown?.Standard || 0, color: '#3B82F6' },
    { name: 'Premium ($299/mo)', value: summary.packageBreakdown?.Premium || 0, color: '#8B5CF6' },
  ].filter((p) => p.value > 0 || tenants.length === 0);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* SaaS Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <Crown className="w-4 h-4 text-amber-300" />
              SaaS Multi-Tenant Owner Control Panel
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SaaS Subscription Dashboard
            </h1>
            <p className="mt-2 text-purple-200 text-sm max-w-xl">
              Monitor active B2B software subscribers, monthly recurring revenue (MRR), tier upgrades, and tenant organization accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/super-admin/tenants')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-purple-950 font-extrabold text-xs shadow-lg hover:bg-purple-50 transition"
            >
              <PlusCircle className="w-4 h-4" /> Manage Tenants
            </button>
            <button
              onClick={fetchSaaSData}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 SaaS Summary KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscribers */}
        <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Subscribers</span>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {summary.activeTenants} <span className="text-xs font-normal text-slate-400">/ {summary.totalTenants} total</span>
          </div>
          <div className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% cloud uptime
          </div>
        </div>

        {/* Card 2: MRR */}
        <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Monthly Revenue (MRR)</span>
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-purple-600 dark:text-purple-400">
            ${fmt(summary.monthlyRecurringRevenue)} <span className="text-xs font-normal text-slate-400">/ mo</span>
          </div>
          <div className="mt-1.5 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> Recurring SaaS billing
          </div>
        </div>

        {/* Card 3: Suspended / Expired */}
        <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Suspended / Expired</span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {summary.suspendedTenants + summary.expiredTenants}
          </div>
          <div className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
            <Activity className="w-3.5 h-3.5" /> {summary.suspendedTenants} suspended, {summary.expiredTenants} expired
          </div>
        </div>

        {/* Card 4: Tier Distribution */}
        <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Package Tiers</span>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 font-bold text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Lite: {summary.packageBreakdown?.Lite || 0}</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Std: {summary.packageBreakdown?.Standard || 0}</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Prem: {summary.packageBreakdown?.Premium || 0}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Active plan breakdown
          </div>
        </div>
      </div>

      {/* ── Middle Grid: Package Distribution Chart & Quick Stats ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" /> Subscription Tier Distribution
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {packageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Package Pricing Models
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Standard SaaS pricing plans available for microfinance organizations.
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-300">Lite Package</p>
                  <p className="text-[10px] text-slate-500">Up to 10 users, 200 loans</p>
                </div>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">$49/mo</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-blue-700 dark:text-blue-300">Standard Package</p>
                  <p className="text-[10px] text-slate-500">Up to 25 users, 1,000 loans</p>
                </div>
                <span className="font-black text-blue-600 dark:text-blue-400 text-sm">$149/mo</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-purple-700 dark:text-purple-300">Premium Package</p>
                  <p className="text-[10px] text-slate-500">Up to 100 users, 5,000 loans</p>
                </div>
                <span className="font-black text-purple-600 dark:text-purple-400 text-sm">$299/mo</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/super-admin/tenants')}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            Manage Subscription Billing <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Recent Subscriber Organizations Table ───────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            Registered SaaS Subscribers ({tenants.length})
          </h2>

          <button
            onClick={() => navigate('/super-admin/tenants')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            View All Tenants <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Organization Name</th>
                <th className="px-4 py-3">Admin Email</th>
                <th className="px-4 py-3">Contact Number</th>
                <th className="px-4 py-3">Package Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Monthly Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tenants.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-500" />
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
                  <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white">
                    ${fmt(t.monthlyFee)}/mo
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No SaaS tenant subscribers registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SaaSDashboard;
