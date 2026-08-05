import React, { useState, useEffect, useCallback } from 'react';
import {
  getAccountsApi,
  createAccountApi,
  getJournalEntriesApi,
  createJournalEntryApi,
  createManualEntryApi,
} from '../services/api';
import {
  BookOpen,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowRightLeft,
  X,
  Building,
  Hash,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TYPE_COLORS = {
  Asset: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
  },
  Liability: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  Equity: {
    bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    iconColor: 'text-purple-500',
  },
  Income: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-500',
  },
  Expense: {
    bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300',
    iconColor: 'text-red-500',
  },
};

const ChartOfAccounts = () => {
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'journal'
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ Asset: 0, Liability: 0, Equity: 0, Income: 0, Expense: 0 });
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [toast, setToast] = useState({ type: '', text: '' });

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEntryType, setManualEntryType] = useState('Expense'); // 'Expense' | 'Income'
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountNumber: '',
    accountType: 'Asset',
    branch: '',
    initialBalance: '0',
    description: '',
  });

  const [journalForm, setJournalForm] = useState({
    debitAccountId: '',
    creditAccountId: '',
    amount: '',
    description: '',
    referenceId: '',
    transactionDate: new Date().toISOString().slice(0, 10),
  });

  const [manualForm, setManualForm] = useState({
    amount: '',
    description: '',
    accountId: '',
    paymentMethod: 'Cash',
  });

  const openManualModal = (type) => {
    setManualEntryType(type);
    const defaultAcc = accounts.find((a) => a.accountType === type)?._id || '';
    setManualForm({
      amount: '',
      description: '',
      accountId: defaultAcc,
      paymentMethod: 'Cash',
    });
    setShowManualModal(true);
  };

  const showToastMsg = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, jRes] = await Promise.all([
        getAccountsApi(),
        getJournalEntriesApi(),
      ]);
      setAccounts(accRes.accounts || []);
      setSummary(accRes.summary || {});
      setJournalEntries(Array.isArray(jRes) ? jRes : []);
    } catch (err) {
      console.error('Error fetching accounting data:', err);
      showToastMsg('error', 'Failed to load chart of accounts data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Account Form Submit
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountForm.accountName || !accountForm.accountNumber) {
      showToastMsg('error', 'Account name and number are required.');
      return;
    }
    setSubmittingAccount(true);
    try {
      await createAccountApi(accountForm);
      showToastMsg('success', 'Account added to Chart of Accounts!');
      setShowAccountModal(false);
      setAccountForm({
        accountName: '',
        accountNumber: '',
        accountType: 'Asset',
        branch: '',
        initialBalance: '0',
        description: '',
      });
      fetchData();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmittingAccount(false);
    }
  };

  // Handle Journal Form Submit
  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!journalForm.debitAccountId || !journalForm.creditAccountId || !journalForm.amount || !journalForm.description) {
      showToastMsg('error', 'Debit account, credit account, amount, and description are required.');
      return;
    }
    if (journalForm.debitAccountId === journalForm.creditAccountId) {
      showToastMsg('error', 'Debit and Credit accounts must be different.');
      return;
    }
    setSubmittingJournal(true);
    try {
      await createJournalEntryApi(journalForm);
      showToastMsg('success', 'Journal entry posted successfully!');
      setShowJournalModal(false);
      setJournalForm({
        debitAccountId: '',
        creditAccountId: '',
        amount: '',
        description: '',
        referenceId: '',
        transactionDate: new Date().toISOString().slice(0, 10),
      });
      fetchData();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || 'Failed to post journal entry.');
    } finally {
      setSubmittingJournal(false);
    }
  };

  // Handle Manual Income/Expense Submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.amount || !manualForm.description || !manualForm.accountId) {
      showToastMsg('error', 'Amount, description, and target account are required.');
      return;
    }
    setSubmittingManual(true);
    try {
      const res = await createManualEntryApi({
        ...manualForm,
        type: manualEntryType,
      });
      showToastMsg('success', res.message || `Manual ${manualEntryType} entry recorded!`);
      setShowManualModal(false);
      fetchData();
    } catch (err) {
      showToastMsg('error', err.response?.data?.message || `Failed to record manual ${manualEntryType}.`);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchType = filterType === 'ALL' || acc.accountType === filterType;
    const matchSearch =
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.branch || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Toast Alert */}
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
            <BookOpen className="w-7 h-7 text-brand-500" />
            Chart of Accounts &amp; General Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your double-entry accounting ledger, view real-time account balances, and post journal entries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openManualModal('Expense')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-500/20"
          >
            <TrendingDown className="w-4 h-4" /> + Add Expense
          </button>
          <button
            onClick={() => openManualModal('Income')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-500/20"
          >
            <TrendingUp className="w-4 h-4" /> + Add Income
          </button>
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition shadow-md shadow-brand-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Add Account
          </button>
          <button
            onClick={() => setShowJournalModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-500/20"
          >
            <ArrowRightLeft className="w-4 h-4" /> Post Journal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          { type: 'Asset', label: 'Total Assets', icon: TrendingUp, val: summary.Asset, color: 'emerald' },
          { type: 'Liability', label: 'Total Liabilities', icon: TrendingDown, val: summary.Liability, color: 'amber' },
          { type: 'Equity', label: 'Total Equity', icon: PieChart, val: summary.Equity, color: 'purple' },
          { type: 'Income', label: 'Total Income', icon: DollarSign, val: summary.Income, color: 'blue' },
          { type: 'Expense', label: 'Total Expenses', icon: Layers, val: summary.Expense, color: 'red' },
        ].map((c) => {
          const Icon = c.icon;
          const style = TYPE_COLORS[c.type];
          return (
            <div key={c.type} className={`border rounded-2xl p-4 ${style.bg} flex items-start gap-3`}>
              <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60">
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-75">{c.label}</p>
                <p className="text-lg font-black mt-0.5">${fmt(c.val)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial justify-center ${
            activeTab === 'accounts'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial justify-center ${
            activeTab === 'journal'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> General Ledger ({journalEntries.length})
        </button>
      </div>

      {/* ── TAB 1: CHART OF ACCOUNTS ────────────────────────────────────────── */}
      {activeTab === 'accounts' && (
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Asset', 'Liability', 'Equity', 'Income', 'Expense'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    filterType === t
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search account name or number..."
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Account #</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAccounts.map((acc) => {
                  const style = TYPE_COLORS[acc.accountType] || TYPE_COLORS.Asset;
                  return (
                    <tr key={acc._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-500">{acc.accountNumber}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{acc.accountName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${style.badge}`}>
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{acc.branch || 'Global'}</td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white text-sm">
                        ${fmt(acc.currentBalance)}
                      </td>
                    </tr>
                  );
                })}
                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      No matching ledger accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: GENERAL LEDGER ──────────────────────────────────────────── */}
      {activeTab === 'journal' && (
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-brand-500" />
            General Ledger Journal Audit Log ({journalEntries.length} entries)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Date</th>
                  <th className="px-4 py-3">Ref ID</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Debit Account (+)</th>
                  <th className="px-4 py-3">Credit Account (-)</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 rounded-r-xl">Posted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {journalEntries.map((j) => (
                  <tr key={j._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {j.transactionDate ? new Date(j.transactionDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-500 font-bold">
                      {j.referenceId || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">{j.description}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        [{j.debitAccount?.accountNumber}] {j.debitAccount?.accountName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        [{j.creditAccount?.accountNumber}] {j.creditAccount?.accountName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white text-sm">
                      ${fmt(j.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {j.createdBy?.name || 'System'}
                    </td>
                  </tr>
                ))}
                {journalEntries.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No journal entries posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: ADD ACCOUNT ────────────────────────────────────────────── */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-500" />
                Add New Ledger Account
              </h2>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Account Number (e.g., 1050)</label>
                <input
                  type="text"
                  required
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  placeholder="e.g. 1050"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={accountForm.accountName}
                  onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                  placeholder="e.g. Petty Cash Vault"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Account Type</label>
                  <select
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Initial Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={accountForm.initialBalance}
                    onChange={(e) => setAccountForm({ ...accountForm, initialBalance: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Branch (optional)</label>
                <input
                  type="text"
                  value={accountForm.branch}
                  onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })}
                  placeholder="e.g. Colombo HQ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  placeholder="e.g. Used for daily office operations"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAccount}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition shadow-lg shadow-brand-500/25 flex items-center gap-2"
                >
                  {submittingAccount ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: POST JOURNAL ENTRY ────────────────────────────────────── */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                Post Double-Entry Journal Transaction
              </h2>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJournalSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold text-emerald-600 dark:text-emerald-400">
                  Debit Account (+)
                </label>
                <select
                  required
                  value={journalForm.debitAccountId}
                  onChange={(e) => setJournalForm({ ...journalForm, debitAccountId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Select Debit Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      [{acc.accountNumber}] {acc.accountName} ({acc.accountType}) — ${fmt(acc.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold text-amber-600 dark:text-amber-400">
                  Credit Account (-)
                </label>
                <select
                  required
                  value={journalForm.creditAccountId}
                  onChange={(e) => setJournalForm({ ...journalForm, creditAccountId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Select Credit Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      [{acc.accountNumber}] {acc.accountName} ({acc.accountType}) — ${fmt(acc.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={journalForm.amount}
                    onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={journalForm.transactionDate}
                    onChange={(e) => setJournalForm({ ...journalForm, transactionDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Description / Memo</label>
                <input
                  type="text"
                  required
                  value={journalForm.description}
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                  placeholder="e.g. Disbursed Loan #L-9812 from Cash Vault"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Reference ID (optional)</label>
                <input
                  type="text"
                  value={journalForm.referenceId}
                  onChange={(e) => setJournalForm({ ...journalForm, referenceId: e.target.value })}
                  placeholder="e.g. LOAN-4821 / CHQ-1092"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJournal}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  {submittingJournal ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Post Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Income / Expense Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {manualEntryType === 'Expense' ? (
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                )}
                Record Manual {manualEntryType} Entry
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Target Account ({manualEntryType}) *</label>
                <select
                  required
                  value={manualForm.accountId}
                  onChange={(e) => setManualForm({ ...manualForm, accountId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                >
                  <option value="">-- Select {manualEntryType} Account --</option>
                  {accounts
                    .filter((a) => a.accountType === manualEntryType)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.accountNumber} - {a.accountName} (Bal: ${fmt(a.currentBalance)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    placeholder="150.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Cash">Cash Vault</option>
                    <option value="Bank Transfer">Bank Operating Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Description / Reason *</label>
                <input
                  type="text"
                  required
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  placeholder={manualEntryType === 'Expense' ? 'e.g. Office Stationery & Supplies' : 'e.g. Processing Fee Collection'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold transition shadow-lg flex items-center gap-2 ${
                    manualEntryType === 'Expense'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                  }`}
                >
                  {submittingManual ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    `Save ${manualEntryType}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
