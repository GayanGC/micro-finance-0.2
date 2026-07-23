import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
  BarChart3
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const role = user?.role || 'Customer';

  // Mock Analytics Data for Recharts
  const collectionsTrendData = [
    { day: 'Mon', target: 3000, collected: 2800 },
    { day: 'Tue', target: 3500, collected: 3400 },
    { day: 'Wed', target: 3200, collected: 3100 },
    { day: 'Thu', target: 4000, collected: 4200 },
    { day: 'Fri', target: 4500, collected: 4350 },
    { day: 'Sat', target: 5000, collected: 4900 },
    { day: 'Sun', target: 2000, collected: 2100 },
  ];

  const portfolioData = [
    { category: 'Micro Business', activeLoans: 620, value: 480000 },
    { category: 'Agriculture', activeLoans: 340, value: 290000 },
    { category: 'Personal Emergency', activeLoans: 280, value: 180000 },
    { category: 'Education', activeLoans: 180, value: 120000 },
  ];

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            {role} Control Center
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
      </div>

      {/* Role-Specific Metric Cards */}
      {role === 'Admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Loan Portfolio</span>
              <div className="p-2 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">$1,248,500</div>
            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4% from last month
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Borrowers</span>
              <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">3,842</div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +48 new this week
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Loans</span>
              <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">1,420</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Avg loan: $880
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Default Rate (PAR)</span>
              <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">1.8%</div>
            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              -0.3% below target risk
            </div>
          </div>
        </div>
      )}

      {role === 'Agent' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Collection Target</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">$3,450.00</div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full w-3/4 rounded-full" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">75% collected ($2,587.50)</span>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assigned Clients</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">124</div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block">118 in good standing</span>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Visits</span>
            <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">6</div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">Scheduled for today</span>
          </div>
        </div>
      )}

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

      {/* RECHARTS ANALYTICS SECTION (Admin & Agent Workspaces) */}
      {role !== 'Customer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Collections Trend Line Chart */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-500" />
                  Weekly Collections Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Target vs Actual Field Repayments ($)</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={collectionsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" stroke={textColor} fontSize={12} />
                  <YAxis stroke={textColor} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: isDark ? '#fff' : '#000',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" name="Target ($)" />
                  <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} name="Collected ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Loan Portfolio Distribution Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-500" />
                  Loan Portfolio Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Capital Disbursed by Business Category ($)</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="category" stroke={textColor} fontSize={11} />
                  <YAxis stroke={textColor} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: isDark ? '#fff' : '#000',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#059669" radius={[8, 8, 0, 0]} name="Portfolio Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Activity Table */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent System Activity
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Live stream
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100/60 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Reference</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">#TX-8821</td>
                <td className="px-4 py-3">Weekly Loan Repayment Collected</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">Agent</span></td>
                <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">+$150.00</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">Completed</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">#LN-4402</td>
                <td className="px-4 py-3">Micro Business Loan Approved</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">Admin</span></td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">$2,500.00</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-semibold">Disbursed</span></td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">#TX-8819</td>
                <td className="px-4 py-3">Monthly Settlement Received</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">Customer</span></td>
                <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">+$350.00</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
