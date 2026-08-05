import React, { useState, useCallback } from 'react';
import {
  getLoanReportApi,
  getCollectionReportApi,
  getOutstandingReportApi,
  getPnLReportApi,
} from '../services/api';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  RefreshCw,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  PieChart,
  Table2,
} from 'lucide-react';

// ── Export helpers (no server needed) ─────────────────────────────────────────

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const exportCSV = (filename, headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportExcel = async (filename, headers, rows) => {
  const { utils, writeFile } = await import('xlsx');
  const ws = utils.aoa_to_sheet([headers, ...rows]);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Report');
  writeFile(wb, filename);
};

const exportPDF = async (title, headers, rows, summary) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Header bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MicroFinance v2.0 — ' + title, 40, 33);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 200, 33);

  // Summary block
  if (summary) {
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    let x = 40, y = 70;
    Object.entries(summary).forEach(([k, v]) => {
      if (typeof v === 'object') return;
      const label = k.replace(/([A-Z])/g, ' $1').trim();
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v), x + 130, y);
      y += 14;
      if (y > 160) { x += 250; y = 70; }
    });
  }

  // Data table
  autoTable(doc, {
    startY: summary ? 180 : 70,
    head: [headers],
    body: rows,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 255] },
  });

  doc.save(filename);
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color = 'brand', prefix = '$' }) => {
  const colorMap = {
    brand: 'from-brand-500/10 to-brand-600/5 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    red: 'from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    slate: 'from-slate-500/10 to-slate-600/5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4 flex items-start gap-3`}>
      <div className={`p-2 rounded-xl bg-white/60 dark:bg-slate-900/60`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
          {prefix}{fmt(value)}
        </p>
      </div>
    </div>
  );
};

const CountCard = ({ label, value, icon: Icon, color = 'slate' }) => (
  <StatCard label={label} value={value} icon={Icon} color={color} prefix="" />
);

const INPUT_CLS =
  'px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-xs';

import { useSubscription } from '../hooks/useSubscription';
import FeatureLockOverlay from '../components/Common/FeatureLockOverlay';

// ── Main Component ─────────────────────────────────────────────────────────────

const Reports = () => {
  const { isLite } = useSubscription();
  const [activeTab, setActiveTab] = useState('loans');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Common filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Loan-specific
  const [loanStatus, setLoanStatus] = useState('');
  const [branch, setBranch] = useState('');

  // Collection-specific
  const [paymentMethod, setPaymentMethod] = useState('');

  // Outstanding-specific
  const [center, setCenter] = useState('');
  const [parBucket, setParBucket] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      let result;
      if (activeTab === 'loans') {
        if (loanStatus) filters.status = loanStatus;
        if (branch) filters.branch = branch;
        result = await getLoanReportApi(filters);
      } else if (activeTab === 'collections') {
        if (paymentMethod) filters.paymentMethod = paymentMethod;
        result = await getCollectionReportApi(filters);
      } else if (activeTab === 'outstanding') {
        if (branch) filters.branch = branch;
        if (center) filters.center = center;
        if (parBucket) filters.parBucket = parBucket;
        result = await getOutstandingReportApi(filters);
      } else if (activeTab === 'pnl') {
        result = await getPnLReportApi(filters);
      }
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, loanStatus, branch, paymentMethod, center, parBucket]);

  // ── Export handlers ──────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (!data) return;
    const { headers, rows, filename } = getExportData();
    exportCSV(filename + '.csv', headers, rows);
  };

  const handleExportExcel = () => {
    if (!data) return;
    const { headers, rows, filename } = getExportData();
    exportExcel(filename + '.xlsx', headers, rows);
  };

  const handleExportPDF = () => {
    if (!data) return;
    const { headers, rows, filename, title } = getExportData();
    exportPDF(title, headers, rows, data.summary || data);
  };

  const getExportData = () => {
    const dateTag = `${startDate || 'all'}_to_${endDate || 'now'}`;
    if (activeTab === 'loans') {
      return {
        title: 'Loan Portfolio Report',
        filename: `loan_report_${dateTag}`,
        headers: ['Loan ID', 'Customer', 'Phone', 'Branch', 'Center', 'Principal', 'Outstanding', 'Status', 'Policy', 'Issued On'],
        rows: (data.loans || []).map((l) => [
          String(l._id).slice(-8).toUpperCase(),
          l.customer?.fullName || '',
          l.customer?.phone || '',
          l.customer?.branch || '',
          l.customer?.center || '',
          l.principalAmount,
          l.remainingBalance,
          l.status,
          l.policy?.name || '',
          l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '',
        ]),
      };
    } else if (activeTab === 'collections') {
      return {
        title: 'Collections Report',
        filename: `collections_report_${dateTag}`,
        headers: ['Receipt No', 'Customer', 'Phone', 'Branch', 'Amount Paid', 'Method', 'Penalty Paid', 'Date', 'Collected By'],
        rows: (data.repayments || []).map((r) => [
          r.receiptNumber,
          r.customerId?.fullName || '',
          r.customerId?.phone || '',
          r.customerId?.branch || '',
          r.amountPaid,
          r.paymentMethod,
          r.penaltyPaid || 0,
          r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '',
          r.collectedBy?.name || '',
        ]),
      };
    } else if (activeTab === 'outstanding') {
      return {
        title: 'Outstanding Balance Report',
        filename: `outstanding_report_${dateTag}`,
        headers: ['Loan ID', 'Customer', 'Phone', 'Branch', 'Center', 'Group', 'Principal', 'Outstanding', 'PAR Bucket', 'Risk Tag'],
        rows: (data.loans || []).map((l) => [
          String(l._id).slice(-8).toUpperCase(),
          l.customer?.fullName || '',
          l.customer?.phone || '',
          l.customer?.branch || '',
          l.customer?.center || '',
          l.customer?.group || '',
          l.principalAmount,
          l.remainingBalance,
          l.parBucket || 'Current',
          l.customer?.riskTag || '',
        ]),
      };
    } else {
      return {
        title: 'Profit & Loss Report',
        filename: `pnl_report_${dateTag}`,
        headers: ['Metric', 'Value'],
        rows: Object.entries(data || {}).filter(([, v]) => typeof v !== 'object').map(([k, v]) => [
          k.replace(/([A-Z])/g, ' $1').trim(), v,
        ]),
      };
    }
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'loans', label: 'Loan Portfolio', icon: CreditCard },
    { id: 'collections', label: 'Collections', icon: Wallet },
    { id: 'outstanding', label: 'Outstanding', icon: TrendingDown },
    { id: 'pnl', label: 'P&L Summary', icon: TrendingUp },
  ];

  if (isLite) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-500" />
            Financial Reports &amp; Statements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Export loan portfolio statements, collection summaries, and profit &amp; loss statements.
          </p>
        </div>
        <FeatureLockOverlay featureTitle="Enterprise Financial Reports &amp; CSV/PDF Exports" minPackage="Standard (Pro)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-500" />
            Financial Reports &amp; Statements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate, filter, and export loan, collection, and P&amp;L reports as PDF, Excel, or CSV.
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Table2 className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/60 transition"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setData(null); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters Panel */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-500" /> Report Filters
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-medium">
          <div>
            <label className="block text-slate-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLS} />
          </div>

          {activeTab === 'loans' && (
            <>
              <div>
                <label className="block text-slate-500 mb-1">Loan Status</label>
                <select value={loanStatus} onChange={(e) => setLoanStatus(e.target.value)} className={INPUT_CLS}>
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Defaulted">Defaulted</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Branch</label>
                <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. Colombo HQ" className={INPUT_CLS} />
              </div>
            </>
          )}

          {activeTab === 'collections' && (
            <div>
              <label className="block text-slate-500 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={INPUT_CLS}>
                <option value="">All Methods</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Mobile Pay</option>
                <option>Agent Doorstep</option>
                <option>Cheque</option>
                <option>Online Gateway</option>
              </select>
            </div>
          )}

          {activeTab === 'outstanding' && (
            <>
              <div>
                <label className="block text-slate-500 mb-1">Branch</label>
                <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch name" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Center</label>
                <input type="text" value={center} onChange={(e) => setCenter(e.target.value)} placeholder="Center name" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">PAR Bucket</label>
                <select value={parBucket} onChange={(e) => setParBucket(e.target.value)} className={INPUT_CLS}>
                  <option value="">All Buckets</option>
                  <option>Current</option>
                  <option>PAR30</option>
                  <option>PAR60</option>
                  <option>PAR90</option>
                  <option>PAR90+</option>
                </select>
              </div>
            </>
          )}
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs transition shadow-lg shadow-brand-500/25 disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {data && (
        <div className="space-y-6">

          {/* LOAN REPORT */}
          {activeTab === 'loans' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                <StatCard label="Total Disbursed" value={data.summary?.totalDisbursed} icon={DollarSign} color="brand" />
                <StatCard label="Total Collected" value={data.summary?.totalCollected} icon={Wallet} color="emerald" />
                <StatCard label="Outstanding" value={data.summary?.totalOutstanding} icon={TrendingDown} color="amber" />
                <CountCard label="Active Loans" value={data.summary?.activeCount} icon={CheckCircle2} color="emerald" />
                <CountCard label="Overdue" value={data.summary?.overdueCount} icon={AlertTriangle} color="red" />
              </div>
              <div className="glass-panel p-5 rounded-3xl overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Loan Portfolio ({data.loans?.length} records)
                </h3>
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-xl">Loan ID</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Branch</th>
                      <th className="px-3 py-2.5">Center</th>
                      <th className="px-3 py-2.5">Principal</th>
                      <th className="px-3 py-2.5">Outstanding</th>
                      <th className="px-3 py-2.5 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.loans?.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">#{String(loan._id).slice(-8).toUpperCase()}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{loan.customer?.fullName}</td>
                        <td className="px-3 py-2.5">{loan.customer?.branch || '—'}</td>
                        <td className="px-3 py-2.5">{loan.customer?.center || '—'}</td>
                        <td className="px-3 py-2.5 font-bold">${fmt(loan.principalAmount)}</td>
                        <td className={`px-3 py-2.5 font-extrabold ${loan.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>${fmt(loan.remainingBalance)}</td>
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
            </>
          )}

          {/* COLLECTIONS REPORT */}
          {activeTab === 'collections' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                <StatCard label="Total Collected" value={data.summary?.totalCollected} icon={Wallet} color="emerald" />
                <StatCard label="Penalty Collected" value={data.summary?.totalPenaltyCollected} icon={AlertTriangle} color="amber" />
                <CountCard label="Transactions" value={data.summary?.totalTransactions} icon={CreditCard} color="brand" />
                {data.summary?.byMethod && Object.entries(data.summary.byMethod).slice(0, 1).map(([method, amt]) => (
                  <StatCard key={method} label={`Top: ${method}`} value={amt} icon={DollarSign} color="purple" />
                ))}
              </div>

              {/* Method breakdown */}
              {data.summary?.byMethod && (
                <div className="glass-panel p-5 rounded-3xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><PieChart className="w-4 h-4 text-brand-500" /> Collections by Method</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(data.summary.byMethod).map(([method, amt]) => (
                      <div key={method} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{method}</span>
                        <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">${fmt(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-panel p-5 rounded-3xl overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Repayment Ledger ({data.repayments?.length} records)</h3>
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-xl">Receipt #</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Branch</th>
                      <th className="px-3 py-2.5">Paid</th>
                      <th className="px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5 rounded-r-xl">Collected By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.repayments?.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-brand-500">{r.receiptNumber}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{r.customerId?.fullName}</td>
                        <td className="px-3 py-2.5">{r.customerId?.branch || '—'}</td>
                        <td className="px-3 py-2.5 font-extrabold text-emerald-600 dark:text-emerald-400">${fmt(r.amountPaid)}</td>
                        <td className="px-3 py-2.5">{r.paymentMethod}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2.5">{r.collectedBy?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* OUTSTANDING REPORT */}
          {activeTab === 'outstanding' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                <StatCard label="Total Outstanding" value={data.summary?.totalOutstanding} icon={TrendingDown} color="amber" />
                <StatCard label="Total Disbursed" value={data.summary?.totalDisbursed} icon={DollarSign} color="brand" />
                <CountCard label="Active Loans" value={data.summary?.totalLoans} icon={CreditCard} color="slate" />
                {data.summary?.parBreakdown?.['PAR30'] !== undefined && (
                  <StatCard label="PAR30 Exposure" value={data.summary.parBreakdown['PAR30']} icon={AlertTriangle} color="red" />
                )}
              </div>

              {/* PAR Breakdown */}
              {data.summary?.parBreakdown && Object.keys(data.summary.parBreakdown).length > 0 && (
                <div className="glass-panel p-5 rounded-3xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><PieChart className="w-4 h-4 text-brand-500" /> PAR Bucket Breakdown</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(data.summary.parBreakdown).map(([bucket, amt]) => (
                      <div key={bucket} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        bucket === 'Current' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : bucket === 'PAR30' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                      }`}>
                        <span className="text-xs font-bold">{bucket}</span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">${fmt(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-panel p-5 rounded-3xl overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Outstanding Loans ({data.loans?.length} records)</h3>
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-xl">Customer</th>
                      <th className="px-3 py-2.5">Branch</th>
                      <th className="px-3 py-2.5">Center</th>
                      <th className="px-3 py-2.5">Group</th>
                      <th className="px-3 py-2.5">Principal</th>
                      <th className="px-3 py-2.5">Outstanding</th>
                      <th className="px-3 py-2.5">PAR</th>
                      <th className="px-3 py-2.5 rounded-r-xl">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.loans?.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{loan.customer?.fullName}</td>
                        <td className="px-3 py-2.5">{loan.customer?.branch || '—'}</td>
                        <td className="px-3 py-2.5">{loan.customer?.center || '—'}</td>
                        <td className="px-3 py-2.5">{loan.customer?.group || '—'}</td>
                        <td className="px-3 py-2.5 font-bold">${fmt(loan.principalAmount)}</td>
                        <td className="px-3 py-2.5 font-extrabold text-amber-600 dark:text-amber-400">${fmt(loan.remainingBalance)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            loan.parBucket === 'Current' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : loan.parBucket === 'PAR30' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                          }`}>{loan.parBucket || 'Current'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[11px] font-bold ${loan.customer?.riskTag === 'High' ? 'text-red-500' : loan.customer?.riskTag === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {loan.customer?.riskTag || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* P&L REPORT */}
          {activeTab === 'pnl' && data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                <StatCard label="Total Disbursed" value={data.totalDisbursed} icon={DollarSign} color="brand" />
                <StatCard label="Interest Expected" value={data.totalInterestExpected} icon={TrendingUp} color="purple" />
                <StatCard label="Total Collected" value={data.totalCollected} icon={Wallet} color="emerald" />
                <StatCard label="Net Income" value={data.netIncome} icon={TrendingUp} color="emerald" />
                <StatCard label="Penalty Income" value={data.totalPenaltyIncome} icon={AlertTriangle} color="amber" />
                <StatCard label="Total Outstanding" value={data.totalOutstanding} icon={TrendingDown} color="red" />
                <StatCard label="Est. Interest Income" value={data.estimatedInterestIncome} icon={BarChart3} color="purple" />
                <CountCard label="Loans Issued" value={data.totalLoansDisbursed} icon={CreditCard} color="slate" />
              </div>
              <div className="glass-panel p-5 rounded-3xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-500" /> P&amp;L Statement
                  <span className="text-xs text-slate-400 font-normal">
                    {data.period?.from} → {data.period?.to}
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Total Loans Disbursed', value: data.totalLoansDisbursed, currency: false },
                    { label: 'Total Principal Disbursed', value: data.totalDisbursed, currency: true },
                    { label: 'Expected Interest Income', value: data.totalInterestExpected, currency: true },
                    { label: 'Actual Collections', value: data.totalCollected, currency: true },
                    { label: 'Penalty & Late Fee Income', value: data.totalPenaltyIncome, currency: true },
                    { label: 'Estimated Interest Earned', value: data.estimatedInterestIncome, currency: true },
                    { label: 'Total Outstanding Portfolio', value: data.totalOutstanding, currency: true },
                    { label: 'Estimated Net Income', value: data.netIncome, currency: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{row.label}</span>
                      <span className={`text-sm font-extrabold ${row.label.includes('Net') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                        {row.currency ? `$${fmt(row.value)}` : row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-3">
          <BarChart3 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Select a report type, apply filters, and click <strong>Generate Report</strong>.
          </p>
          <p className="text-xs text-slate-400">PDF, Excel, and CSV export available after generating.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
