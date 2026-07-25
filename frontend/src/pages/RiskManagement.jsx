import React, { useEffect, useState, useCallback } from 'react';
import {
  getCustomersApi,
  updateCustomerApi,
  recalculateCreditScoreApi,
} from '../services/api';
import {
  AlertTriangle,
  ShieldOff,
  Shield,
  TrendingUp,
  Search,
  RefreshCw,
  Star,
  Filter,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const RISK_COLORS = {
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Very High': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CRIB_COLORS = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, (score / 850) * 100));
  const color = score >= 700 ? 'bg-emerald-500' : score >= 500 ? 'bg-amber-500' : score >= 300 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 dark:text-slate-400">Credit Score</span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{score} / 850</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const CustomerRiskCard = ({ customer, onToggleBlacklist, onRecalculate }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleBlacklist = async () => {
    setLoading(true);
    await onToggleBlacklist(customer._id, !customer.isBlacklisted);
    setLoading(false);
  };

  const handleRecalculate = async () => {
    setLoading(true);
    await onRecalculate(customer._id);
    setLoading(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
      customer.isBlacklisted
        ? 'border-red-300 dark:border-red-800 shadow-sm shadow-red-100 dark:shadow-red-900/10'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              customer.isBlacklisted
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-brand-100 dark:bg-brand-900/30'
            }`}>
              {customer.isBlacklisted
                ? <ShieldOff className="w-5 h-5 text-red-500" />
                : <Shield className="w-5 h-5 text-brand-500" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{customer.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{customer.nicNumber} • {customer.phone}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${RISK_COLORS[customer.riskTag] || RISK_COLORS.Low}`}>
              {customer.riskTag || 'Low'} Risk
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CRIB_COLORS[customer.cribCategory] || CRIB_COLORS.A}`}>
              CRIB: {customer.cribCategory}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <ScoreBar score={customer.creditScore || 0} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
            <p className="text-xs text-slate-400 dark:text-slate-500">Monthly Income</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              LKR {(customer.monthlyIncome || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
            <p className="text-xs text-slate-400 dark:text-slate-500">KYC Status</p>
            <p className={`text-sm font-bold ${
              customer.kycStatus === 'Verified' ? 'text-emerald-600' :
              customer.kycStatus === 'Rejected' ? 'text-red-500' : 'text-amber-500'
            }`}>{customer.kycStatus}</p>
          </div>
        </div>

        {customer.isBlacklisted && customer.blacklistReason && (
          <div className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
            🚫 Blacklist reason: {customer.blacklistReason}
          </div>
        )}

        {/* Guarantors */}
        {customer.guarantors?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium"
          >
            {customer.guarantors.length} Guarantor(s)
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        {expanded && customer.guarantors?.length > 0 && (
          <div className="mt-2 space-y-2">
            {customer.guarantors.map((g, idx) => (
              <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{g.name}</span>
                <span className="text-slate-400 dark:text-slate-500"> • {g.relationship} • {g.phone}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleToggleBlacklist}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
              customer.isBlacklisted
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
              customer.isBlacklisted ? <><CheckCircle className="w-3.5 h-3.5" /> Remove Blacklist</> : <><XCircle className="w-3.5 h-3.5" /> Blacklist</>
            }
          </button>
          <button
            onClick={handleRecalculate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};

const RiskManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBlacklisted, setFilterBlacklisted] = useState('');
  const [filterKYC, setFilterKYC] = useState('');
  const [filterCRIB, setFilterCRIB] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterBlacklisted !== '') filters.isBlacklisted = filterBlacklisted;
      if (filterKYC) filters.kycStatus = filterKYC;
      if (filterCRIB) filters.cribCategory = filterCRIB;
      if (filterRisk) filters.riskTag = filterRisk;
      const data = await getCustomersApi(filters);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterBlacklisted, filterKYC, filterCRIB, filterRisk]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleBlacklist = async (id, blacklist) => {
    try {
      const reason = blacklist ? prompt('Enter blacklist reason:') : '';
      if (blacklist && !reason) return;
      await updateCustomerApi(id, { isBlacklisted: blacklist, blacklistReason: reason || '' });
      fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecalculate = async (id) => {
    try {
      await recalculateCreditScoreApi(id);
      fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = customers.filter((c) =>
    !search ||
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.nicNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // Stats
  const blacklistedCount = customers.filter((c) => c.isBlacklisted).length;
  const highRiskCount = customers.filter((c) => ['High', 'Very High'].includes(c.riskTag)).length;
  const cribD = customers.filter((c) => c.cribCategory === 'D').length;
  const pendingKYC = customers.filter((c) => c.kycStatus === 'Pending').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-400 flex items-center justify-center shadow-lg shadow-red-500/25">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Risk Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Credit scoring, CRIB classification & blacklist registry</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, color: 'text-slate-900 dark:text-white', icon: Users },
          { label: 'Blacklisted', value: blacklistedCount, color: 'text-red-600', icon: ShieldOff },
          { label: 'High Risk', value: highRiskCount, color: 'text-orange-600', icon: AlertTriangle },
          { label: 'Pending KYC', value: pendingKYC, color: 'text-amber-600', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, NIC or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-800 dark:text-slate-100"
          />
        </div>
        <select
          value={filterBlacklisted}
          onChange={(e) => setFilterBlacklisted(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Blacklist</option>
          <option value="true">Blacklisted</option>
          <option value="false">Not Blacklisted</option>
        </select>
        <select
          value={filterKYC}
          onChange={(e) => setFilterKYC(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All KYC</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select
          value={filterCRIB}
          onChange={(e) => setFilterCRIB(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All CRIB</option>
          <option value="A">CRIB A</option>
          <option value="B">CRIB B</option>
          <option value="C">CRIB C</option>
          <option value="D">CRIB D</option>
        </select>
      </div>

      {/* Customer Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Customers Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Adjust your filters to see customers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((customer) => (
            <CustomerRiskCard
              key={customer._id}
              customer={customer}
              onToggleBlacklist={handleToggleBlacklist}
              onRecalculate={handleRecalculate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RiskManagement;
