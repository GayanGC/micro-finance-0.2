import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLoansApi, approveLoanApi } from '../services/api';
import {
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  User,
  CreditCard,
  Building2,
} from 'lucide-react';

const STAGE_LABELS = {
  agent_review: { label: 'Pending Agent Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  credit_officer_review: { label: 'Credit Officer Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: User },
  branch_manager_review: { label: 'Branch Manager Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Building2 },
  fully_approved: { label: 'Fully Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
};

const ROLE_STAGE_MAP = {
  Agent: 'agent',
  credit_officer: 'credit_officer',
  Admin: 'branch_manager',
  super_admin: 'branch_manager',
};

const ApprovalCard = ({ loan, userRole, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const workflow = loan.approvalWorkflow || {};
  const stageInfo = STAGE_LABELS[workflow.currentStage] || STAGE_LABELS.agent_review;
  const StageIcon = stageInfo.icon;

  const canApprove = () => {
    if (workflow.currentStage === 'fully_approved' || workflow.currentStage === 'rejected') return false;
    if (userRole === 'Agent' && workflow.currentStage === 'agent_review') return true;
    if (userRole === 'credit_officer' && workflow.currentStage === 'credit_officer_review') return true;
    if (['Admin', 'super_admin'].includes(userRole) && workflow.currentStage === 'branch_manager_review') return true;
    return false;
  };

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(loan._id, ROLE_STAGE_MAP[userRole] || 'agent');
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await onReject(loan._id, rejectReason);
    setLoading(false);
    setRejecting(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {loan.customer?.fullName || 'Unknown Customer'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loan.customer?.nicNumber} • {loan.customer?.phone}
              </p>
            </div>
          </div>

          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${stageInfo.color}`}>
            <StageIcon className="w-3 h-3" />
            {stageInfo.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">Principal</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              LKR {(loan.principalAmount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">EMI / Month</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              LKR {(loan.monthlyInstallment || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">Policy</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {loan.policy?.policyName || 'N/A'}
            </p>
          </div>
        </div>

        {/* Approval Pipeline */}
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            Approval Pipeline
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="mt-3 space-y-2">
              {[
                { label: 'Agent', approved: workflow.agentApproved, by: workflow.agentApprovedBy?.name },
                { label: 'Credit Officer', approved: workflow.creditOfficerApproved, by: workflow.creditOfficerApprovedBy?.name },
                { label: 'Branch Manager', approved: workflow.branchManagerApproved, by: workflow.branchManagerApprovedBy?.name },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-2 text-sm">
                  {step.approved
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  <span className="text-slate-700 dark:text-slate-300">{step.label}</span>
                  {step.by && <span className="text-xs text-slate-400 dark:text-slate-500">— {step.by}</span>}
                </div>
              ))}
              {workflow.currentStage === 'rejected' && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
                  Rejected: {workflow.rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {canApprove() && !rejecting && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold transition-all"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {rejecting && (
          <div className="mt-4 space-y-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={2}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all"
              >
                {loading ? 'Processing...' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Approvals = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoansApi({ status: 'Pending' });
      setLoans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleApprove = async (loanId, stage) => {
    try {
      await approveLoanApi(loanId, { stage, action: 'approve' });
      fetchLoans();
    } catch (e) {
      console.error('Approval failed:', e);
    }
  };

  const handleReject = async (loanId, rejectionReason) => {
    try {
      await approveLoanApi(loanId, { action: 'reject', rejectionReason });
      fetchLoans();
    } catch (e) {
      console.error('Rejection failed:', e);
    }
  };

  const filtered = loans.filter((l) => {
    const matchSearch =
      !search ||
      l.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      l.customer?.nicNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStage =
      filterStage === 'all' || l.approvalWorkflow?.currentStage === filterStage;
    return matchSearch && matchStage;
  });

  const stageCounts = loans.reduce((acc, l) => {
    const s = l.approvalWorkflow?.currentStage || 'agent_review';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loan Approvals</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Multi-level approval workflow</p>
          </div>
        </div>
        <button
          onClick={fetchLoans}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pending', value: loans.length, color: 'text-brand-600' },
          { label: 'Agent Review', value: stageCounts['agent_review'] || 0, color: 'text-amber-600' },
          { label: 'Credit Officer', value: stageCounts['credit_officer_review'] || 0, color: 'text-blue-600' },
          { label: 'Branch Manager', value: stageCounts['branch_manager_review'] || 0, color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
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
            placeholder="Search by customer name or NIC..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-800 dark:text-slate-100"
          />
        </div>
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <option value="all">All Stages</option>
          <option value="agent_review">Agent Review</option>
          <option value="credit_officer_review">Credit Officer Review</option>
          <option value="branch_manager_review">Branch Manager Review</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Pending Approvals</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All loan applications have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((loan) => (
            <ApprovalCard
              key={loan._id}
              loan={loan}
              userRole={user?.role}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals;
