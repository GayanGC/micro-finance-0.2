import React, { useState, useEffect } from 'react';
import PrintStatementButton from '../components/PrintStatementButton';
import { getLoansApi, addRepaymentApi, getRepaymentsApi } from '../services/api';
import {
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  Filter,
  PlusCircle,
  CreditCard,
  Printer
} from 'lucide-react';

const Collections = () => {
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Repayment Submission Form State
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchCollectionsData();
  }, []);

  const fetchCollectionsData = async () => {
    try {
      setLoading(true);
      const [loansData, repaymentsData] = await Promise.all([
        getLoansApi(),
        getRepaymentsApi(),
      ]);
      setLoans(loansData.filter((l) => l.status === 'Active'));
      setRepayments(repaymentsData);

      if (loansData.length > 0 && !selectedLoanId) {
        setSelectedLoanId(loansData[0]._id);
      }
    } catch (err) {
      console.error('Error fetching collections data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanSelectionChange = (e) => {
    const loanId = e.target.value;
    setSelectedLoanId(loanId);
    const selectedLoan = loans.find((l) => l._id === loanId);
    if (selectedLoan) {
      setAmountPaid(selectedLoan.monthlyInstallment || '');
    }
  };

  const handleRepaymentSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!selectedLoanId || !amountPaid || Number(amountPaid) <= 0) {
      setMessage({ type: 'error', text: 'Please select an Active Loan and enter a valid payment amount.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await addRepaymentApi({
        loanId: selectedLoanId,
        amountPaid: Number(amountPaid),
        paymentMethod,
      });

      setMessage({ type: 'success', text: res.message || 'Repayment recorded successfully!' });
      setAmountPaid('');
      fetchCollectionsData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit repayment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRepayments = (Array.isArray(repayments) ? repayments : []).filter((rep) => {
    const custName = (rep?.customerId?.fullName || rep?.customerId?.name || '').toLowerCase();
    const receiptNo = (rep?.receiptNumber || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();
    return custName.includes(query) || receiptNo.includes(query);
  });

  const totalCollectedToday = repayments.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-7 h-7 text-brand-500" />
            Field Agent Daily Collection Sheet
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record client door-to-door EMI settlements, update remaining loan balances, and issue receipt vouchers.
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
              : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          {message.text}
        </div>
      )}

      {/* Top Layout Grid: Collection Entry Form (Left) & Summary KPI (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Smart Collection Submission Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <PlusCircle className="w-5 h-5 text-brand-500" />
            Record New Client Repayment
          </h2>

          <form onSubmit={handleRepaymentSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Select Active Borrower Account *</label>
              <select
                required
                value={selectedLoanId}
                onChange={handleLoanSelectionChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">-- Choose Active Loan Account --</option>
                {loans.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.customer?.fullName || l.customer?.name} ({l.customer?.phone}) - Bal: ${l.remainingBalance?.toLocaleString()} [EMI: ${l.monthlyInstallment}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Amount Paid ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="350.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Payment Method / Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Cash">Agent Doorstep Cash</option>
                  <option value="Bank Transfer">Online Bank Transfer</option>
                  <option value="Mobile Pay">Mobile Pay / Wallet</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Payment & Issue Receipt
                </>
              )}
            </button>
          </form>
        </div>

        {/* Collection Metrics (Right) */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Collections Logged Today</span>
            <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
              ${totalCollectedToday.toLocaleString()}
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
              {repayments.length} verified transactions recorded
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs space-y-2">
            <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
              Atomic Balance Protection
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Submitting a repayment strictly deducts from the borrower's remaining balance. If balance reaches $0$, loan status automatically marks as <strong>Completed</strong>.
            </p>
          </div>
        </div>

      </div>

      {/* Transaction History Ledger */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            Today's Collection History ({filteredRepayments.length})
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer or receipt ref..."
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Receipt Ref</th>
                <th className="px-4 py-3">Customer Borrower</th>
                <th className="px-4 py-3">Amount Cleared</th>
                <th className="px-4 py-3">New Balance</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRepayments.map((rep, idx) => (
                <tr key={rep._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-bold text-brand-600 dark:text-brand-400">{rep.receiptNumber}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    {rep.customerId?.fullName || rep.customerId?.name || 'Customer'}
                    <div className="text-[11px] font-normal text-slate-400">{rep.customerId?.phone}</div>
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">${(rep.amountPaid || 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">${(rep.newRemainingBalance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{rep.paymentMethod}</td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {rep.paymentDate ? new Date(rep.paymentDate).toLocaleTimeString() : 'Just Now'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <PrintStatementButton receiptData={rep} title="Collection Receipt" label="Print Receipt" />
                  </td>
                </tr>
              ))}
              {filteredRepayments.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400">
                    No collection records logged yet today. Use the form above to record payments.
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

export default Collections;
