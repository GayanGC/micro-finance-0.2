import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getDashboardAnalyticsApi } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Wallet,
  PieChart as PieIcon,
  Activity,
  Award,
} from 'lucide-react';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const role = user?.role || 'Customer';

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardAnalyticsApi();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'Customer') {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [role, fetchAnalytics]);

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  const summary = analytics?.summary || {
    activeLoans: 0,
    todayCollections: 0,
    totalDisbursed: 0,
    totalOutstanding: 0,
    activeCustomers: 0,
    overdueLoans: 0,
  };

  const collectionsData = analytics?.monthlyCollections || [
    { month: 'Mar', collections: 12500 },
    { month: 'Apr', collections: 18400 },
    { month: 'May', collections: 22100 },
    { month: 'Jun', collections: 19800 },
    { month: 'Jul', collections: 27500 },
    { month: 'Aug', collections: 31200 },
  ];

  const statusDistribution = analytics?.statusDistribution || [
    { name: 'Active', value: 45, color: '#10B981' },
    { name: 'Completed', value: 30, color: '#4F46E5' },
    { name: 'Overdue', value: 12, color: '#F59E0B' },
    { name: 'Pending', value: 8, color: '#3B82F6' },
    { name: 'Defaulted', value: 5, color: '#EF4444' },
  ];

  const disbursementsData = analytics?.monthlyDisbursements || [
    { month: 'Mar', disbursements: 35000, count: 14 },
    { month: 'Apr', disbursements: 42000, count: 18 },
    { month: 'May', disbursements: 28000, count: 11 },
    { month: 'Jun', disbursements: 51000, count: 22 },
    { month: 'Jul', disbursements: 46000, count: 19 },
    { month: 'Aug', disbursements: 58000, count: 25 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" />
              {role} Analytics Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="mt-2 text-brand-100 text-sm max-w-xl">
              {role === 'Admin' && 'Real-time financial portfolio oversight, field collection trends, and operational metrics.'}
              {role === 'Agent' && 'Daily collection target tracking, assigned customer loan status, and active repayments.'}
              {role === 'Customer' && 'Manage active loans, track upcoming monthly EMI settlements, and update profile.'}
            </p>
          </div>

          {role !== 'Customer' && (
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          )}
        </div>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────────────── */}
      {role !== 'Customer' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Loans */}
          <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01] hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Loans</span>
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              {summary.activeLoans}
            </div>
            <div className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <Activity className="w-3.5 h-3.5" /> {summary.overdueLoans} overdue / flagged
            </div>
          </div>

          {/* Card 2: Today's Collections */}
          <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01] hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Today's Collections</span>
              <div className="p-2.5 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              ${fmt(summary.todayCollections)}
            </div>
            <div className="mt-1.5 text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> Doorstep &amp; gateway collections
            </div>
          </div>

          {/* Card 3: Total Disbursed */}
          <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01] hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Disbursed</span>
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              ${fmt(summary.totalDisbursed)}
            </div>
            <div className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold">
              <Users className="w-3.5 h-3.5" /> Across {summary.activeCustomers} active clients
            </div>
          </div>

          {/* Card 4: Total Outstanding */}
          <div className="glass-card p-5 rounded-2xl transition hover:scale-[1.01] hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Outstanding</span>
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              ${fmt(summary.totalOutstanding)}
            </div>
            <div className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5" /> Portfolio balance receivable
            </div>
          </div>
        </div>
      )}

      {/* Customer Specific Banner */}
      {role === 'Customer' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border-l-4 border-brand-500">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Loan Balance</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">$4,200.00</div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">Loan ID: #LN-9082</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-blue-500">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Next EMI Due Date</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Aug 05, 2026</div>
            <span className="text-xs text-brand-600 dark:text-brand-400 mt-1 inline-block font-semibold">Amount: $350.00</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border-l-4 border-emerald-500">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Repayment Status</span>
            <div className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" /> On Track
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">12 of 24 installments paid</span>
          </div>
        </div>
      )}

      {/* ── RECHARTS ANALYTICS SECTION (Admin, Agent, Auditor, Credit Officer) ─ */}
      {role !== 'Customer' && (
        <>
          {/* Middle Grid: Left (Span 2) = Collections AreaChart, Right (Span 1) = Status PieChart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Collections Trend AreaChart (Span 2) */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    Monthly Collections Trend
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    6-month aggregate payment collections ($)
                  </p>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={collectionsData}>
                    <defs>
                      <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="month" stroke={textColor} fontSize={12} />
                    <YAxis stroke={textColor} fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(val) => [`$${fmt(val)}`, 'Collected']}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '12px',
                        color: isDark ? '#fff' : '#000',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="collections"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCollections)"
                      name="Collections ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Loan Status PieChart (Span 1) */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-emerald-500" />
                  Portfolio Status
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Loan account distribution</p>
              </div>

              <div className="h-72 w-full pt-2 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [val, name]}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Monthly Disbursements BarChart */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-500" />
                  Monthly Disbursements Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total capital issued over the last 6 months ($)
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={disbursementsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={textColor} fontSize={12} />
                  <YAxis stroke={textColor} fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val) => [`$${fmt(val)}`, 'Disbursed']}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: isDark ? '#fff' : '#000',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="disbursements" fill="#10B981" radius={[8, 8, 0, 0]} name="Disbursed Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
