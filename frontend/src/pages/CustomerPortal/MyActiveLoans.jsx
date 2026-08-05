import React, { useState, useEffect } from 'react';
import { getPortalLoansApi } from '../../services/api';
import {
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Percent,
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

const MyActiveLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await getPortalLoansApi();
      setLoans(data || []);
    } catch (err) {
      console.error('Error loading customer portal loans:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeLoans = loans.filter((l) => l.status === 'Active' || l.status === 'Approved');
  const totalBorrowed = loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-500" />
            My Active Loans &amp; Repayment Progress
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active loan balances, monthly EMI installments, capital reduction, and amortization schedules.
          </p>
        </div>

        <button
          onClick={fetchLoans}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Loans
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Active Accounts</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {activeLoans.length} <span className="text-xs font-normal text-slate-400">/ {loans.length} total</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Capital Borrowed</span>
          <div className="mt-2 text-2xl font-black text-brand-600 dark:text-brand-400">
            ${fmt(totalBorrowed)}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Outstanding Balance</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${fmt(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="space-y-6">
        {loans.map((loan) => {
          const totalPayable = loan.totalPayable || (loan.principalAmount + (loan.totalInterest || 0));
          const totalPaid = Math.max(0, totalPayable - (loan.remainingBalance || 0));
          const progressPercent = Math.min(100, Math.round((totalPaid / (totalPayable || 1)) * 100));

          return (
            <div key={loan._id} className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {loan.policy?.policyName || 'Standard Microfinance Loan'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                      loan.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                        : loan.status === 'Completed'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Ref ID: #{String(loan._id).slice(-8).toUpperCase()} • Disbursed: {fmtDate(loan.disbursedAt || loan.createdAt)}</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly EMI Installment</span>
                  <span className="text-xl font-black text-brand-600 dark:text-brand-400">${fmt(loan.monthlyInstallment)}/mo</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Repayment Clearance Progress</span>
                  <span className="text-brand-600 dark:text-brand-400 font-extrabold">{progressPercent}% Paid</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Paid: ${fmt(totalPaid)}</span>
                  <span>Total Payable: ${fmt(totalPayable)}</span>
                </div>
              </div>

              {/* Loan Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">PRINCIPAL CAPITAL</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">${fmt(loan.principalAmount)}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">REMAINING CAPITAL</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${fmt(loan.remainingPrincipal ?? loan.principalAmount)}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">TOTAL OUTSTANDING</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">${fmt(loan.remainingBalance)}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">INTEREST METHOD</span>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">{loan.interestMethod || 'Reducing Balance'}</span>
                </div>
              </div>

              {/* Repayment Schedule Table */}
              {Array.isArray(loan.repaymentSchedule) && loan.repaymentSchedule.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-500" /> Amortization Installment Schedule
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="px-3 py-2 rounded-l-lg">Month #</th>
                          <th className="px-3 py-2">Due Date</th>
                          <th className="px-3 py-2">Expected EMI</th>
                          <th className="px-3 py-2">Capital</th>
                          <th className="px-3 py-2 text-right rounded-r-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {loan.repaymentSchedule.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">Month #{s.installmentNo || idx + 1}</td>
                            <td className="px-3 py-2 text-slate-400">{fmtDate(s.dueDate)}</td>
                            <td className="px-3 py-2 font-black">${fmt(s.expectedInstallment)}</td>
                            <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">${fmt(s.principalComponent)}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                s.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                                  : s.status === 'partial'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                              }`}>
                                {s.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loans.length === 0 && (
          <div className="glass-panel p-12 text-center text-slate-400 rounded-3xl space-y-2">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No active loans found.</p>
            <p className="text-xs">Contact your field agent to submit a new loan application.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActiveLoans;
