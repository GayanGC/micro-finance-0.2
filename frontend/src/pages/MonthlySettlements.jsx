import React, { useState, useEffect } from 'react';
import PrintStatementButton from '../components/PrintStatementButton';
import { getRepaymentsApi } from '../services/api';
import { CalendarCheck, CheckCircle2, DollarSign, Receipt, FileText } from 'lucide-react';

const MonthlySettlements = () => {
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySettlements();
  }, []);

  const fetchMySettlements = async () => {
    try {
      setLoading(true);
      const data = await getRepaymentsApi();
      setRepayments(data);
    } catch (err) {
      console.error('Error fetching customer settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-7 h-7 text-brand-500" />
              Monthly EMI Settlement Receipts ({repayments.length})
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              View official payment receipt vouchers, transaction timestamps, and remaining balances.
            </p>
          </div>

          <PrintStatementButton referenceId="#ALL-SETTLEMENTS" title="Annual Settlement Ledger" label="Print Full Payment Ledger" />
        </div>
      </div>

      {/* Settlements Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand-500" />
          Completed EMI Clearances & Receipts
        </h2>

        {loading ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading settlement receipts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Receipt Ref</th>
                  <th className="px-4 py-3">Amount Cleared</th>
                  <th className="px-4 py-3">Remaining Loan Balance</th>
                  <th className="px-4 py-3">Date Paid</th>
                  <th className="px-4 py-3">Payment Channel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Receipt Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {repayments.map((rep, idx) => (
                  <tr key={rep._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-bold text-brand-600 dark:text-brand-400">
                      {rep.receiptNumber || `#REC-2026-0${idx + 1}`}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${(rep.amountPaid || 350).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      ${(rep.newRemainingBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {rep.paymentDate ? new Date(rep.paymentDate).toLocaleDateString() : 'Jul 05, 2026'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {rep.paymentMethod || 'Agent Doorstep Cash'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <PrintStatementButton receiptData={rep} title="Payment Receipt" label="Print Receipt" />
                    </td>
                  </tr>
                ))}
                {repayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-slate-400">
                      No payment settlement records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySettlements;
