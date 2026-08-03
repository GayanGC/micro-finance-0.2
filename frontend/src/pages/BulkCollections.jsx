import React, { useState, useEffect, useCallback } from 'react';
import { getLoansApi, bulkRepaymentApi } from '../services/api';
import {
  Banknote,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Search,
  ChevronDown,
  XCircle,
  TrendingDown,
  CreditCard,
  ClipboardList,
} from 'lucide-react';

const INPUT_CLS =
  'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-xs';

const BulkCollections = () => {
  // ── State ──────────────────────────────────────────────────────────
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [centerFilter, setCenterFilter] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [batchNote, setBatchNote] = useState('');

  // Per-loan paid amount map: { [loanId]: number }
  const [paidAmounts, setPaidAmounts] = useState({});

  // Toast / result
  const [toast, setToast] = useState({ type: '', text: '' });
  const [result, setResult] = useState(null);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // ── Derived ────────────────────────────────────────────────────────
  // All distinct center values from active loans
  const availableCenters = [
    ...new Set(
      allLoans
        .map((l) => l?.customer?.center || '')
        .filter(Boolean)
    ),
  ].sort();

  // Loans filtered by selected center
  const filteredLoans = allLoans.filter((loan) => {
    const loanCenter = loan?.customer?.center || '';
    const matchCenter = centerFilter ? loanCenter === centerFilter : true;
    const matchSearch =
      centerSearch
        ? (loan?.customer?.fullName || '').toLowerCase().includes(centerSearch.toLowerCase()) ||
          (loan?._id || '').toLowerCase().includes(centerSearch.toLowerCase())
        : true;
    return matchCenter && matchSearch;
  });

  // Rows where the user entered a positive paid amount
  const pendingRows = filteredLoans.filter(
    (l) => Number(paidAmounts[l._id] || 0) > 0
  );

  const totalCollection = pendingRows.reduce(
    (sum, l) => sum + Number(paidAmounts[l._id] || 0),
    0
  );

  // ── Data fetch ─────────────────────────────────────────────────────
  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setResult(null);
      const data = await getLoansApi({ status: 'Active' });
      // Populate customer.center from the loan's customer object
      setAllLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading loans:', err);
      showToast('error', 'Failed to load active loans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // ── Helpers ────────────────────────────────────────────────────────
  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 5000);
  };

  const handleAmountChange = (loanId, value) => {
    setPaidAmounts((prev) => ({ ...prev, [loanId]: value }));
  };

  const setAllToEMI = () => {
    const updates = {};
    filteredLoans.forEach((loan) => {
      if (loan.monthlyInstallment > 0) {
        updates[loan._id] = loan.monthlyInstallment;
      }
    });
    setPaidAmounts((prev) => ({ ...prev, ...updates }));
  };

  const clearAll = () => {
    const cleared = {};
    filteredLoans.forEach((l) => { cleared[l._id] = ''; });
    setPaidAmounts((prev) => ({ ...prev, ...cleared }));
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (pendingRows.length === 0) {
      showToast('error', 'Please enter a paid amount for at least one loan.');
      return;
    }

    const payments = pendingRows.map((loan) => ({
      loanId: loan._id,
      amount: Number(paidAmounts[loan._id]),
      note: batchNote,
    }));

    setSubmitting(true);
    setResult(null);
    setToast({ type: '', text: '' });

    try {
      const res = await bulkRepaymentApi({
        payments,
        paymentDate,
        paymentMethod,
        notes: batchNote,
        sendWhatsAppMsg: sendWhatsApp,
      });

      setResult(res);
      showToast(
        res.failed?.length === 0 ? 'success' : 'warning',
        res.message
      );

      // Clear amounts for succeeded loans
      const succeededIds = new Set(res.succeeded.map((s) => s.loanId));
      setPaidAmounts((prev) => {
        const next = { ...prev };
        succeededIds.forEach((id) => { next[id] = ''; });
        return next;
      });

      // Refresh data
      fetchLoans();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Bulk submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Banknote className="w-7 h-7 text-brand-500" />
          Bulk Collections — Center / Group
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select a Center, enter paid amounts for multiple borrowers, and submit all collections in one batch.
        </p>
      </div>

      {/* Toast */}
      {toast.text && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
              : toast.type === 'warning'
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300'
              : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-5 rounded-3xl">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-brand-500" />
          Filters &amp; Collection Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
          {/* Center dropdown */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">Filter by Center</label>
            <div className="relative">
              <select
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className={INPUT_CLS + ' pr-8 appearance-none'}
              >
                <option value="">— All Centers —</option>
                {availableCenters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Client search */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">Search Client / Loan ID</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={centerSearch}
                onChange={(e) => setCenterSearch(e.target.value)}
                placeholder="Name or Loan ID..."
                className={INPUT_CLS + ' pl-8'}
              />
            </div>
          </div>

          {/* Payment date */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">Collection Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">Payment Method</label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={INPUT_CLS + ' pr-8 appearance-none'}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Pay">Mobile Pay</option>
                <option value="Agent Doorstep">Agent Doorstep</option>
                <option value="Cheque">Cheque</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Batch note + action buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 text-xs font-medium">
            <label className="block text-slate-600 dark:text-slate-300 mb-1">Batch Note (optional)</label>
            <input
              type="text"
              value={batchNote}
              onChange={(e) => setBatchNote(e.target.value)}
              placeholder="e.g. Weekly center meeting collection"
              className={INPUT_CLS}
            />
          </div>

          {/* WhatsApp Toggle */}
          <div className="mt-3 flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-base">📱</span>
              Send WhatsApp Confirmation
              <span className="text-[10px] text-slate-400 font-normal">(per customer on success)</span>
            </span>
            <div
              onClick={() => setSendWhatsApp(!sendWhatsApp)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                sendWhatsApp ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  sendWhatsApp ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={setAllToEMI}
              title="Fill all rows with their monthly EMI"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-200 dark:hover:bg-brand-900 transition"
            >
              Auto-fill EMI
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              Clear All
            </button>
            <button
              onClick={fetchLoans}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Collection Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-500" />
            Active Loans
            {centerFilter && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Center: {centerFilter}
              </span>
            )}
            <span className="text-xs text-slate-400 font-normal">
              ({filteredLoans.length} loans)
            </span>
          </h2>

          {/* Summary chip */}
          {pendingRows.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <TrendingDown className="w-3.5 h-3.5" />
              {pendingRows.length} entries · Total: ${totalCollection.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading active loans…</span>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p>No active loans found{centerFilter ? ` for center "${centerFilter}"` : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Client Name</th>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Center</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Monthly EMI</th>
                  <th className="px-4 py-3">Outstanding Balance</th>
                  <th className="px-4 py-3 rounded-r-xl w-36">Paid Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLoans.map((loan) => {
                  const paid = Number(paidAmounts[loan._id] || 0);
                  const isEntered = paid > 0;
                  const isOverpay = paid > loan.remainingBalance;
                  return (
                    <tr
                      key={loan._id}
                      className={`transition-colors ${
                        isEntered
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Client Name */}
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {loan?.customer?.fullName || 'N/A'}
                        <div className="text-[11px] font-normal text-slate-400">
                          {loan?.customer?.phone || ''}
                        </div>
                      </td>

                      {/* Loan ID */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        #{String(loan._id).slice(-8).toUpperCase()}
                      </td>

                      {/* Center */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                          {loan?.customer?.center || '—'}
                        </span>
                      </td>

                      {/* Group */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold text-[11px]">
                          {loan?.customer?.group || '—'}
                        </span>
                      </td>

                      {/* Monthly EMI */}
                      <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">
                        ${(loan?.monthlyInstallment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Outstanding Balance */}
                      <td className={`px-4 py-3 font-extrabold ${
                        loan.remainingBalance <= 0
                          ? 'text-slate-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        ${(loan?.remainingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Paid Amount Input */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paidAmounts[loan._id] || ''}
                          onChange={(e) => handleAmountChange(loan._id, e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 transition-colors ${
                            isOverpay
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 focus:ring-amber-400'
                              : isEntered
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500'
                              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-brand-500'
                          }`}
                        />
                        {isOverpay && (
                          <p className="text-[10px] text-amber-500 mt-0.5">Exceeds balance</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Bar */}
      {filteredLoans.length > 0 && (
        <div className="glass-panel px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">Ready to submit: </span>
            <span className="font-bold text-slate-900 dark:text-white">{pendingRows.length} payment{pendingRows.length !== 1 ? 's' : ''}</span>
            {totalCollection > 0 && (
              <span className="text-brand-600 dark:text-brand-400 font-extrabold ml-2">
                · ${totalCollection.toLocaleString(undefined, { minimumFractionDigits: 2 })} total
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || pendingRows.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 text-white font-bold text-sm transition shadow-lg shadow-brand-500/25 cursor-pointer"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? 'Processing…' : 'Submit Bulk Collection'}
          </button>
        </div>
      )}

      {/* Results Panel */}
      {result && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-500" />
            Batch Result Summary
          </h3>

          {/* Success rows */}
          {result.succeeded?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">
                ✅ {result.succeeded.length} Succeeded
              </p>
              <div className="space-y-1.5">
                {result.succeeded.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{s.customerName}</span>
                      <span className="ml-2 text-slate-400 font-mono">{s.receiptNumber}</span>
                      {s.loanCompleted && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                          LOAN COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        -${s.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        Balance: ${s.newRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed rows */}
          {result.failed?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">
                ❌ {result.failed.length} Failed
              </p>
              <div className="space-y-1.5">
                {result.failed.map((f, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300"
                  >
                    {f.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkCollections;
