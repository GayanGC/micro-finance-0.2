import React, { useState, useEffect } from 'react';
import PrintStatementButton from '../components/PrintStatementButton';
import { useAuth } from '../context/AuthContext';
import { getLoansApi } from '../services/api';
import { CreditCard, Calendar, CheckCircle2, ShieldCheck, DollarSign, Layers } from 'lucide-react';

const MyActiveLoans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const fetchMyLoans = async () => {
    try {
      setLoading(true);
      const data = await getLoansApi();
      setLoans(data);
    } catch (err) {
      console.error('Error fetching customer active loans:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" /> Borrower Workspace Portal
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Active Micro Loans ({loans.length})
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track remaining loan principal balances, applied policy schemes, and monthly settlement amounts.
            </p>
          </div>

          <PrintStatementButton referenceId="#MY-PORTFOLIO" title="Official Portfolio Summary" label="Download All Loan Statements" />
        </div>
      </div>

      {/* Loan Details List */}
      {loading ? (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Fetching active loan portfolio...</p>
        </div>
      ) : loans.length > 0 ? (
        loans.map((loan, idx) => {
          const principal = loan.principalAmount || 0;
          const remaining = loan.remainingBalance || 0;
          const totalPayable = loan.totalPayable || (principal + (loan.totalInterest || 0));
          const progressPct = totalPayable > 0 ? Math.round(((totalPayable - remaining) / totalPayable) * 100) : 0;

          return (
            <div key={loan._id || idx} className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {loan._id ? `#LN-${loan._id.substring(0, 8)}` : `#LN-9082`}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {loan.policy?.policyName || 'Micro Business Loan Scheme'}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold w-fit">
                  {loan.status || 'Active'} Status
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Principal Amount</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">${principal.toLocaleString()}</div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium">Applied Policy</span>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    {loan.policy?.interestRate || 12}% {loan.policy?.interestType || 'Flat'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium">Calculated Monthly EMI</span>
                  <div className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                    ${(loan.monthlyInstallment || 0).toLocaleString()}/mo
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium">Remaining Balance</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${remaining.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Repayment Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Repayment Settlement Progress ({progressPct}%)</span>
                  <span className="text-slate-500">Term: {loan.policy?.durationMonths || 12} Months</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/60 dark:bg-slate-800/60 p-4 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Total Interest Charge: <strong className="text-amber-600 dark:text-amber-400">+${(loan.totalInterest || 0).toFixed(2)}</strong>
                  </span>
                </div>

                <PrintStatementButton referenceId={loan._id ? `#LN-${loan._id.substring(0, 6)}` : '#LN-9082'} title="Repayment Schedule" label="Print Statement" />
              </div>
            </div>
          );
        })
      ) : (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Loans Assigned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You do not currently have any active microfinance loans. Contact your local field agent to apply.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyActiveLoans;
