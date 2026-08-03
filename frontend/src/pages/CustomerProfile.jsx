import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerTimelineApi } from '../services/api';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  UserCheck,
  Award,
  Clock,
  Star,
  Activity,
  RefreshCw,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  CUSTOMER_REGISTERED: {
    icon: UserCheck,
    colorClass: 'bg-brand-500',
    ringClass: 'ring-brand-300 dark:ring-brand-700',
    textClass: 'text-brand-600 dark:text-brand-400',
    bgClass: 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800',
    label: 'Customer Registered',
  },
  DISBURSEMENT: {
    icon: Banknote,
    colorClass: 'bg-blue-500',
    ringClass: 'ring-blue-300 dark:ring-blue-700',
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    label: 'Loan Disbursed',
  },
  REPAYMENT: {
    icon: CheckCircle2,
    colorClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-300 dark:ring-emerald-700',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    label: 'Repayment',
  },
  PENALTY: {
    icon: AlertTriangle,
    colorClass: 'bg-red-500',
    ringClass: 'ring-red-300 dark:ring-red-700',
    textClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    label: 'Penalty / Overdue',
  },
  LOAN_COMPLETED: {
    icon: Award,
    colorClass: 'bg-amber-500',
    ringClass: 'ring-amber-300 dark:ring-amber-700',
    textClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    label: 'Loan Fully Repaid 🎉',
  },
};

const RISK_BADGE = {
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'Very High': 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
};

const CRIB_BADGE = {
  A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  D: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ── Sub-components ───────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, icon: Icon, color, prefix = '$', suffix = '' }) => {
  const colors = {
    brand: 'from-brand-500/10 to-brand-600/5 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    red: 'from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.brand} border rounded-2xl p-4 flex items-start gap-3`}>
      <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
          {prefix}{fmt(value)}{suffix}
        </p>
      </div>
    </div>
  );
};

const ScoreMeter = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 75 ? '#10b981'
    : pct >= 50 ? '#f59e0b'
    : pct >= 25 ? '#f97316'
    : '#ef4444';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Credit Score</span>
        <span className="font-extrabold text-slate-900 dark:text-white">{score}/100</span>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>Poor</span><span>Fair</span><span>Good</span><span>Excellent</span>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getCustomerTimelineApi(id);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading customer profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{error}</p>
        <button onClick={() => navigate(-1)} className="text-xs text-brand-500 hover:underline">← Go Back</button>
      </div>
    );
  }

  if (!data) return null;

  const { customer, summary, events, loans } = data;
  const filteredEvents = filterType === 'ALL'
    ? events
    : events.filter((e) => e.type === filterType);

  const EVENT_TYPES = ['ALL', 'DISBURSEMENT', 'REPAYMENT', 'PENALTY', 'LOAN_COMPLETED', 'CUSTOMER_REGISTERED'];

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </button>

      {/* ── Profile Header ─────────────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-lg shadow-brand-500/30">
            {customer.fullName?.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{customer.fullName}</h1>
              {customer.isBlacklisted && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                  🚫 Blacklisted
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${RISK_BADGE[summary.riskTag] || RISK_BADGE.Low}`}>
                {summary.riskTag} Risk
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${CRIB_BADGE[summary.cribCategory] || CRIB_BADGE.A}`}>
                CRIB: {summary.cribCategory}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                customer.kycStatus === 'Verified'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : customer.kycStatus === 'Pending'
                  ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
              }`}>
                KYC: {customer.kycStatus}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />{customer.nicNumber}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{customer.address}</span>
              {customer.branch && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{customer.branch}{customer.center ? ` › ${customer.center}` : ''}{customer.group ? ` › ${customer.group}` : ''}</span>}
            </div>
          </div>

          {/* Refresh */}
          <button onClick={load} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Credit Score Meter */}
        <div className="mt-5 max-w-md">
          <ScoreMeter score={summary.creditScore} />
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <SummaryCard label="Total Borrowed" value={summary.totalBorrowed} icon={Banknote} color="blue" />
        <SummaryCard label="Total Paid" value={summary.totalPaid} icon={CheckCircle2} color="emerald" />
        <SummaryCard label="Outstanding" value={summary.totalOutstanding} icon={TrendingDown} color="amber" />
        <SummaryCard label="Active Loans" value={summary.activeLoans} icon={Activity} color="brand" prefix="" />
        <SummaryCard label="Completed" value={summary.completedLoans} icon={Award} color="purple" prefix="" />
        <SummaryCard label="Overdue" value={summary.overdueLoans} icon={AlertTriangle} color="red" prefix="" />
      </div>

      {/* ── Active Loans Quick View ─────────────────────────────────────── */}
      {loans.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-500" /> Loan Portfolio ({loans.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 rounded-l-xl">Loan ID</th>
                  <th className="px-3 py-2.5">Policy</th>
                  <th className="px-3 py-2.5">Principal</th>
                  <th className="px-3 py-2.5">Monthly EMI</th>
                  <th className="px-3 py-2.5">Outstanding</th>
                  <th className="px-3 py-2.5">Next Due</th>
                  <th className="px-3 py-2.5 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">#{String(loan._id).slice(-8).toUpperCase()}</td>
                    <td className="px-3 py-2.5 font-semibold">{loan.policy?.policyName || '—'}</td>
                    <td className="px-3 py-2.5 font-bold">${fmt(loan.principalAmount)}</td>
                    <td className="px-3 py-2.5">${fmt(loan.monthlyInstallment)}</td>
                    <td className={`px-3 py-2.5 font-extrabold ${loan.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ${fmt(loan.remainingBalance)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{fmtDateShort(loan.nextDueDate)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        loan.status === 'Active' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                        : loan.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : loan.status === 'Overdue' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      }`}>{loan.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div className="glass-panel p-5 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            Credit History Timeline
            <span className="text-xs font-normal text-slate-400">({filteredEvents.length} events)</span>
          </h2>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  filterType === t
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t === 'ALL' ? 'All' : EVENT_CONFIG[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="text-sm">No events for this filter.</p>
          </div>
        ) : (
          <ol className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-0">
            {filteredEvents.map((event, idx) => {
              const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.REPAYMENT;
              const Icon = cfg.icon;
              const isLast = idx === filteredEvents.length - 1;

              return (
                <li key={idx} className={`ml-6 ${isLast ? 'pb-0' : 'pb-7'} relative`}>
                  {/* Node dot */}
                  <span
                    className={`absolute -left-[38px] flex items-center justify-center w-8 h-8 rounded-full ${cfg.colorClass} ring-4 ${cfg.ringClass} ring-white dark:ring-slate-950 shadow-sm`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </span>

                  {/* Card */}
                  <div className={`ml-2 p-4 rounded-2xl border ${cfg.bgClass} transition-all hover:shadow-sm`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${cfg.textClass}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          #{event.referenceId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{fmtDate(event.date)}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {event.amount > 0 && (
                        <span className={`text-lg font-black ${cfg.textClass}`}>
                          {event.type === 'PENALTY' ? '-' : event.type === 'REPAYMENT' || event.type === 'LOAN_COMPLETED' ? '+' : ''}${fmt(event.amount)}
                        </span>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex-1">{event.notes}</p>
                    </div>

                    {/* Extra meta badges */}
                    {event.meta && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {event.meta.paymentMethod && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {event.meta.paymentMethod}
                          </span>
                        )}
                        {event.meta.policyName && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {event.meta.policyName} · {event.meta.interestRate}% · {event.meta.durationMonths}mo
                          </span>
                        )}
                        {event.meta.collectedBy && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            By: {event.meta.collectedBy}
                          </span>
                        )}
                        {event.meta.parBucket && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            PAR: {event.meta.parBucket}
                          </span>
                        )}
                        {event.meta.kycStatus && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            KYC: {event.meta.kycStatus}
                          </span>
                        )}
                        {event.meta.newRemainingBalance !== undefined && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            Balance: ${fmt(event.meta.newRemainingBalance)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
