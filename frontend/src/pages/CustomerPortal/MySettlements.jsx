import React, { useState, useEffect } from 'react';
import { getPortalSettlementsApi, getPortalProfileApi } from '../../services/api';
import { generatePaymentReceipt } from '../../utils/receiptGenerator';
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  Calendar,
  CreditCard,
  Printer,
  DollarSign,
} from 'lucide-react';

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

const MySettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settlementData, profileData] = await Promise.all([
        getPortalSettlementsApi(),
        getPortalProfileApi(),
      ]);
      setSettlements(settlementData || []);
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching portal settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (repayment) => {
    const cust = profile || repayment.customerId || {};
    const loanObj = repayment.loanId || {};
    generatePaymentReceipt(repayment, cust, loanObj);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPaid = settlements.reduce((sum, s) => sum + (s.amountPaid || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            Payment Receipts &amp; Settlement History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View completed EMI payment clearances, receipt numbers, payment methods, and download official A5 PDF vouchers.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Settlements
        </button>
      </div>

      {/* Summary Banner Card */}
      <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Lifetime Settlements Paid</span>
          <div className="mt-1 text-3xl font-black text-brand-600 dark:text-brand-400">
            ${fmt(totalPaid)}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            {settlements.length} verified payment receipt vouchers issued
          </span>
        </div>

        <div className="p-3 bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400 rounded-2xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      </div>

      {/* Settlements Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-500" />
          Receipt Vouchers Ledger ({settlements.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Receipt #</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3 font-bold">Amount Paid</th>
                <th className="px-4 py-3">New Remaining Balance</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {settlements.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    {item.receiptNumber || `REC-${String(item._id).slice(-8)}`}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{fmtDate(item.paymentDate || item.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    ${fmt(item.amountPaid)}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    ${fmt(item.newRemainingBalance)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleDownloadPDF(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 hover:bg-brand-100 font-bold transition text-xs border border-brand-200 dark:border-brand-800"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF Receipt
                    </button>
                  </td>
                </tr>
              ))}

              {settlements.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No payment settlement receipts recorded yet.
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

export default MySettlements;
