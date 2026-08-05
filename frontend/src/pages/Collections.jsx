import React, { useState, useEffect } from 'react';
import PrintStatementButton from '../components/PrintStatementButton';
import { getLoansApi, addRepaymentApi, getRepaymentsApi } from '../services/api';
import { generatePaymentReceipt } from '../utils/receiptGenerator';
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
  Printer,
  MapPin,
  Wifi,
  WifiOff,
  Download,
  FileText,
  Zap,
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
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' | 'interest' | 'custom'
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const selectedLoan = loans.find((l) => l._id === selectedLoanId);

  const calculateInterestDue = (loan) => {
    if (!loan) return 0;
    const capital = loan.remainingPrincipal ?? loan.principalAmount ?? 0;
    const annualRate = loan.policy?.interestRate || 12;
    const monthlyRate = (annualRate / 100) / 12;
    return Math.round(capital * monthlyRate * 100) / 100;
  };

  const handleModeChange = (mode, loan = selectedLoan) => {
    setPaymentMode(mode);
    if (!loan) return;
    if (mode === 'full') {
      setAmountPaid(String(loan.monthlyInstallment || ''));
    } else if (mode === 'interest') {
      const interestDue = calculateInterestDue(loan);
      setAmountPaid(String(interestDue));
    } else if (mode === 'custom') {
      setAmountPaid('');
    }
  };

  const handleLoanSelectionChange = (e) => {
    const loanId = e.target.value;
    setSelectedLoanId(loanId);
    const loan = loans.find((l) => l._id === loanId);
    if (loan) {
      handleModeChange(paymentMode, loan);
    }
  };

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

  const captureGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsLoading(false);
      },
      () => {
        alert('Unable to retrieve your location. Please allow location access.');
        setGpsLoading(false);
      }
    );
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
        gpsLocation: gpsLocation || undefined,
        notes: notes || undefined,
        sendWhatsAppMsg: sendWhatsApp,
      });

      setMessage({ type: 'success', text: res.message || 'Repayment recorded successfully!' });
      
      // Auto-generate & download PDF Receipt
      if (res.repayment) {
        generatePaymentReceipt(res.repayment, res.repayment.customerId, res.repayment.loanId);
      }

      setAmountPaid('');
      setNotes('');
      setGpsLocation(null);
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
    const matchSearch = custName.includes(query) || receiptNo.includes(query);
    const matchMethod = !paymentMethodFilter || rep.paymentMethod === paymentMethodFilter;
    return matchSearch && matchMethod;
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

            {/* Segmented Radio Button Group for Payment Mode */}
            {selectedLoan && (
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">Select Collection Payment Mode</label>
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleModeChange('full')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      paymentMode === 'full'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Full EMI (${selectedLoan.monthlyInstallment})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('interest')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      paymentMode === 'interest'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Interest Only (${calculateInterestDue(selectedLoan)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('custom')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      paymentMode === 'custom'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Amount Paid ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  value={amountPaid}
                  onChange={(e) => {
                    setAmountPaid(e.target.value);
                    setPaymentMode('custom');
                  }}
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
                  <option value="Online Gateway">Online Payment Gateway</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Kiosk">Kiosk</option>
                </select>
              </div>
            </div>

            {/* Dynamic Payment Breakdown Box */}
            {selectedLoan && amountPaid && Number(amountPaid) > 0 && (() => {
              const capital = selectedLoan.remainingPrincipal ?? selectedLoan.principalAmount ?? 0;
              const annualRate = selectedLoan.policy?.interestRate || 12;
              const interestDue = Math.round((capital * (annualRate / 100 / 12)) * 100) / 100;
              const paid = Number(amountPaid);
              const actualInterest = Math.min(paid, interestDue);
              const capitalReduction = Math.max(0, Math.round((paid - actualInterest) * 100) / 100);
              const shortfall = interestDue > paid ? Math.round((interestDue - paid) * 100) / 100 : 0;

              return (
                <div className="space-y-2 animate-fade-in">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 font-medium">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      Payment Breakdown (${paid.toFixed(2)}):
                    </span>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-purple-600 dark:text-purple-400">Interest Portion: ${actualInterest.toFixed(2)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">Capital Reduction: ${capitalReduction.toFixed(2)}</span>
                    </div>
                  </div>

                  {shortfall > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>Warning: Payment does not cover full interest (${interestDue.toFixed(2)} due). Arrears of <strong>${shortfall.toFixed(2)}</strong> will carry forward.</span>
                    </div>
                  )}

                  {capitalReduction > 0 && paid > (selectedLoan.monthlyInstallment || 0) && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-bold">
                      <Zap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Excess Capital Paydown! Extra <strong>${(paid - selectedLoan.monthlyInstallment).toFixed(2)}</strong> will directly reduce the remaining Capital Principal!</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* GPS Capture */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={captureGPS}
                disabled={gpsLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  gpsLocation
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {gpsLoading ? 'Getting GPS...' : gpsLocation ? `GPS: ${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : 'Capture GPS Location'}
              </button>
              {gpsLocation && (
                <button type="button" onClick={() => setGpsLocation(null)} className="text-xs text-red-400 hover:text-red-500">
                  Clear
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Customer paid partial..." 
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* WhatsApp Toggle */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
              <label className="flex items-center justify-between cursor-pointer gap-3 select-none">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="text-base">📱</span>
                  Send WhatsApp Confirmation
                  <span className="text-[10px] text-slate-400 font-normal">(to customer)</span>
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
              </label>
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

      {/* ── Active Repayment Schedule Table for Selected Borrower ─────────────── */}
      {selectedLoan && Array.isArray(selectedLoan.repaymentSchedule) && selectedLoan.repaymentSchedule.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Active Repayment Schedule ({selectedLoan.customer?.fullName || selectedLoan.customer?.name})
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500">Remaining Capital: <strong className="text-emerald-600 dark:text-emerald-400 font-black">${(selectedLoan.remainingPrincipal ?? selectedLoan.principalAmount)?.toLocaleString()}</strong></span>
              <span className="text-slate-500">Method: <strong className="text-brand-600 dark:text-brand-400 font-bold">{selectedLoan.interestMethod || 'Reducing Balance'}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Month #</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Expected EMI</th>
                  <th className="px-4 py-3">Capital Principal</th>
                  <th className="px-4 py-3">Interest Portion</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {selectedLoan.repaymentSchedule.map((s, idx) => {
                  const isPending = s.status === 'pending' || s.status === 'Pending' || s.status === 'partial';
                  const firstPendingIdx = selectedLoan.repaymentSchedule.findIndex(item => item.status === 'pending' || item.status === 'Pending' || item.status === 'partial');
                  const isFirstPending = isPending && idx === firstPendingIdx;

                  return (
                    <tr
                      key={idx}
                      className={`transition ${
                        isFirstPending
                          ? 'bg-amber-50/90 dark:bg-amber-950/50 font-bold border-l-4 border-l-amber-500'
                          : s.status === 'paid'
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-400'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        Month #{s.installmentNo || idx + 1}
                        {isFirstPending && (
                          <span className="ml-2 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black tracking-wide">
                            CURRENT DUE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(s.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-black text-slate-900 dark:text-white">${Number(s.expectedInstallment || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">${Number(s.principalComponent || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500">${Number(s.interestComponent || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          s.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : s.status === 'partial'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {s.status === 'partial'
                            ? `PARTIAL ($${Math.max(0, (s.expectedInstallment || 0) - (s.paidAmount || 0)).toFixed(2)} DUE)`
                            : s.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <td className="px-4 py-3.5 text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => generatePaymentReceipt(rep, rep.customerId, rep.loanId)}
                      title="Download Official PDF Receipt"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-200 dark:hover:bg-brand-900/60 transition"
                    >
                      <Download className="w-3 h-3" /> PDF Receipt
                    </button>
                    <PrintStatementButton receiptData={rep} title="Collection Receipt" label="Print" />
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
