import React, { useState, useEffect, useCallback } from 'react';
import {
  openRegisterApi,
  getActiveRegisterApi,
  closeRegisterApi,
  getAllRegistersApi,
} from '../services/api';
import {
  Calculator,
  PlayCircle,
  StopCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Wallet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  History,
  AlertTriangle,
  UserCheck,
  Building,
  ShieldCheck,
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

const CashierDesk = () => {
  const [activeData, setActiveData] = useState(null); // { active: bool, register, totalCollections, collectionsCount, expectedBalance }
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', text: '' });

  // Open Form State
  const [startingBalance, setStartingBalance] = useState('100');
  const [openBranch, setOpenBranch] = useState('');
  const [openNotes, setOpenNotes] = useState('');
  const [opening, setOpening] = useState(false);

  // Close Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const showToastMsg = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const fetchDeskData = useCallback(async () => {
    setLoading(true);
    try {
      const [actRes, logsRes] = await Promise.all([
        getActiveRegisterApi(),
        getAllRegistersApi(),
      ]);
      setActiveData(actRes);
      setHistoryLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error('Error loading Cashier Desk:', err);
      showToastMsg('error', 'Failed to load Cashier Desk data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeskData();
  }, [fetchDeskData]);

  // Open Register Handler
  const handleOpenRegister = async (e) => {
    e.preventDefault();
    const numFloat = Number(startingBalance);
    if (isNaN(numFloat) || numFloat < 0) {
      showToastMsg('error', 'Please enter a valid starting cash float (>= 0).');
      return;
    }

    setOpening(true);
    try {
      await openRegisterApi({
        startingBalance: numFloat,
        branch: openBranch,
        notes: openNotes,
      });
      showToastMsg('success', 'Register shift opened successfully! 🚀');
      fetchDeskData();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || 'Failed to open register.');
    } finally {
      setOpening(false);
    }
  };

  // Close Register Handler
  const handleCloseRegister = async (e) => {
    e.preventDefault();
    const numClosing = Number(closingBalance);
    if (isNaN(numClosing) || numClosing < 0) {
      showToastMsg('error', 'Please enter a valid physical closing cash count.');
      return;
    }

    setClosing(true);
    try {
      const res = await closeRegisterApi({
        closingBalance: numClosing,
        notes: closeNotes,
      });
      showToastMsg('success', 'Register shift closed successfully! 🔒');
      setShowCloseModal(false);
      setClosingBalance('');
      setCloseNotes('');
      fetchDeskData();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || 'Failed to close register.');
    } finally {
      setClosing(false);
    }
  };

  const isShiftOpen = activeData?.active && activeData?.register;
  const activeReg = activeData?.register;

  // Live discrepancy calculation for closing modal
  const numCloseVal = Number(closingBalance || 0);
  const liveExpected = activeData?.expectedBalance || 0;
  const liveDiscrepancy = Math.round((numCloseVal - liveExpected) * 100) / 100;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Toast alert */}
      {toast.text && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border transition ${
            toast.type === 'error'
              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-brand-500" />
            Cashier Desk &amp; Shift Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily cash floats, live collection totals, and balance physical cash counts at shift close.
          </p>
        </div>

        <button
          onClick={fetchDeskData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {/* ── STATE 1: NO SHIFT OPEN ────────────────────────────────────────────── */}
      {!isShiftOpen && !loading && (
        <div className="glass-panel p-8 rounded-3xl max-w-xl mx-auto space-y-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <PlayCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Start New Cashier Shift Session</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Open your cash register before receiving client payments.</p>
            </div>
          </div>

          <form onSubmit={handleOpenRegister} className="space-y-4 text-xs font-medium pt-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">
                Starting Cash Float ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  placeholder="100.00"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Physical cash drawer float at start of shift.</p>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Branch (optional)</label>
              <input
                type="text"
                value={openBranch}
                onChange={(e) => setOpenBranch(e.target.value)}
                placeholder="e.g. Head Office Vault"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Notes / Opening Remarks (optional)</label>
              <input
                type="text"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                placeholder="e.g. Shift 1 morning drawer count"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={opening}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              {opening ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><PlayCircle className="w-5 h-5" /> Open Register Shift</>}
            </button>
          </form>
        </div>
      )}

      {/* ── STATE 2: ACTIVE SHIFT OPEN ────────────────────────────────────────── */}
      {isShiftOpen && (
        <div className="space-y-6">
          {/* Active Shift Header Banner */}
          <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 animate-pulse">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Shift Session</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    🟢 OPEN
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Opened by <strong>{activeReg.cashier?.name}</strong> at {fmtDate(activeReg.openTime)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs transition shadow-lg shadow-red-500/25 self-start sm:self-auto cursor-pointer"
            >
              <StopCircle className="w-4 h-4" /> Close Register / End Shift
            </button>
          </div>

          {/* 4 Active Shift Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Starting Float</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">${fmt(activeReg.startingBalance)}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">Initial cash drawer float</span>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Live Collections</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${fmt(activeData.totalCollections)}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">{activeData.collectionsCount} payments logged</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border-2 border-brand-500/30">
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">Calculated Expected Cash</span>
              <p className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">${fmt(activeData.expectedBalance)}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">Float + Collections</span>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Shift Duration</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-500" />
                {Math.max(0, Math.floor((new Date() - new Date(activeReg.openTime)) / (1000 * 60)))} mins
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Active drawer session</span>
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTER SHIFT HISTORY REPORT TABLE ───────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-brand-500" />
          Register Shifts History &amp; Audit Logs ({historyLogs.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Shift ID</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Open Time</th>
                <th className="px-4 py-3">Close Time</th>
                <th className="px-4 py-3">Float</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Closing Count</th>
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {historyLogs.map((log) => {
                const disc = Math.round(((log.closingBalance || 0) - (log.expectedBalance || 0)) * 100) / 100;
                return (
                  <tr key={log._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-500 font-bold">
                      #{String(log._id).slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {log.cashier?.name || 'Cashier'}
                      <div className="text-[10px] text-slate-400 font-normal">{log.cashier?.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{fmtDate(log.openTime)}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{log.closeTime ? fmtDate(log.closeTime) : '—'}</td>
                    <td className="px-4 py-3.5 font-semibold">${fmt(log.startingBalance)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">${fmt(log.expectedBalance)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">${fmt(log.closingBalance)}</td>
                    <td className="px-4 py-3.5">
                      {log.status === 'CLOSED' ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          disc === 0
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : disc > 0
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300'
                        }`}>
                          {disc === 0 ? 'Balanced' : disc > 0 ? `+$${fmt(disc)} Surplus` : `-$${fmt(Math.abs(disc))} Short`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        log.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {historyLogs.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">
                    No register shift history logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: CLOSE REGISTER / END SHIFT ─────────────────────────────────── */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <StopCircle className="w-5 h-5 text-red-500" />
                Close Register &amp; Balance Drawer
              </h2>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Expected System Cash:</span>
              <span className="text-base font-black text-brand-600 dark:text-brand-400">${fmt(liveExpected)}</span>
            </div>

            <form onSubmit={handleCloseRegister} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">
                  Physical Cash Count ($) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    placeholder="e.g. 1350.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Total counted physical notes &amp; coins in drawer.</p>
              </div>

              {/* Live Discrepancy Preview */}
              {closingBalance !== '' && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                  liveDiscrepancy === 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : liveDiscrepancy > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300'
                }`}>
                  <span>Variance / Discrepancy:</span>
                  <span>{liveDiscrepancy === 0 ? 'Balanced ($0.00)' : liveDiscrepancy > 0 ? `+$${fmt(liveDiscrepancy)} Surplus` : `-$${fmt(Math.abs(liveDiscrepancy))} Shortage`}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Notes / Discrepancy Explanation (optional)</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Explain any cash overages or shortages..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closing}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-lg shadow-red-500/25 flex items-center gap-2"
                >
                  {closing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm & End Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDesk;
