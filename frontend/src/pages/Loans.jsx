import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PrintStatementButton from '../components/PrintStatementButton';
import {
  getPoliciesApi,
  createPolicyApi,
  getCustomersApi,
  getLoansApi,
  calculateLoanApi,
  createLoanApi,
} from '../services/api';
import {
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Settings,
  Calculator,
  Percent,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const Loans = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState('repayment');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data Collections
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loan Issuing Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [collateralDetails, setCollateralDetails] = useState('');
  const [submittingLoan, setSubmittingLoan] = useState(false);

  // Live Auto-Calculation State
  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Policy Creation Form State
  const [policyForm, setPolicyForm] = useState({
    policyName: '',
    interestRate: '',
    durationMonths: '12',
    interestType: 'Flat',
    description: '',
  });
  const [submittingPolicy, setSubmittingPolicy] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [loansData, customersData, policiesData] = await Promise.all([
        getLoansApi(),
        getCustomersApi(),
        getPoliciesApi(),
      ]);
      setLoans(loansData);
      setCustomers(customersData);
      setPolicies(policiesData);

      if (policiesData.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(policiesData[0]._id);
      }
      if (customersData.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customersData[0]._id);
      }
    } catch (err) {
      console.error('Error loading loans module data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Live Calculation whenever Policy or Principal changes
  useEffect(() => {
    if (selectedPolicyId && principalAmount && Number(principalAmount) > 0) {
      handleCalculate(selectedPolicyId, principalAmount);
    } else {
      setCalculation(null);
    }
  }, [selectedPolicyId, principalAmount]);

  const handleCalculate = async (pId, pAmt) => {
    try {
      setCalculating(true);
      const res = await calculateLoanApi(pId, pAmt);
      setCalculation(res);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleIssueLoanSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!selectedCustomerId || !selectedPolicyId || !principalAmount) {
      setMessage({ type: 'error', text: 'Please select a Customer, Policy, and enter Principal Amount.' });
      return;
    }

    setSubmittingLoan(true);

    try {
      const res = await createLoanApi({
        customerId: selectedCustomerId,
        policyId: selectedPolicyId,
        principalAmount: Number(principalAmount),
        collateralDetails,
      });
      setMessage({ type: 'success', text: res.message || 'Loan issued successfully!' });
      setPrincipalAmount('');
      setCollateralDetails('');
      setCalculation(null);
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to issue loan.' });
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handlePolicyFormChange = (e) => {
    setPolicyForm({ ...policyForm, [e.target.name]: e.target.value });
  };

  const handleCreatePolicySubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmittingPolicy(true);

    try {
      const res = await createPolicyApi({
        ...policyForm,
        interestRate: Number(policyForm.interestRate),
        durationMonths: Number(policyForm.durationMonths),
      });
      setMessage({ type: 'success', text: res.message || 'Policy created successfully!' });
      setPolicyForm({
        policyName: '',
        interestRate: '',
        durationMonths: '12',
        interestType: 'Flat',
        description: '',
      });
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create policy.' });
    } finally {
      setSubmittingPolicy(false);
    }
  };

  const filteredLoans = (Array.isArray(loans) ? loans : []).filter((l) => {
    const custName = (l?.customer?.fullName || l?.customer?.name || '').toLowerCase();
    const loanId = (l?._id || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();
    return custName.includes(query) || loanId.includes(query);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-brand-500" />
          Advanced Loan Engine & Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure loan policies (Flat & Reducing Balance), auto-calculate EMI installments, and track repayment ledgers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('repayment')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'repayment'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Loan Repayment Ledger ({loans.length})
        </button>

        <button
          onClick={() => setActiveTab('issuing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'issuing'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Issue New Loan (Auto-Calc)
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('policies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'policies'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            Loan Policies ({policies.length})
          </button>
        )}
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

      {/* TAB 1: Loan Repayment Ledger */}
      {activeTab === 'repayment' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-500" />
              Active Loans Ledger ({filteredLoans.length})
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search borrower name or loan ref..."
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Borrower Customer</th>
                  <th className="px-4 py-3">Applied Policy</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Total Interest</th>
                  <th className="px-4 py-3">Monthly EMI</th>
                  <th className="px-4 py-3">Remaining Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLoans.map((loan, idx) => (
                  <tr key={loan._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {loan?.customer?.fullName || loan?.customer?.name || 'Customer'}
                      <div className="text-[11px] font-normal text-slate-400">{loan?.customer?.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        {loan?.policy?.policyName || 'Standard Policy'}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {loan?.policy?.interestRate}% {loan?.policy?.interestType} ({loan?.policy?.durationMonths}M)
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold">${(loan?.principalAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5 font-semibold text-amber-600 dark:text-amber-400">${(loan?.totalInterest || 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                      ${(loan?.monthlyInstallment || 0).toLocaleString()}/mo
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${(loan?.remainingBalance || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {loan?.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <PrintStatementButton referenceId={loan?._id ? `#LN-${loan._id.substring(0,6)}` : '#LN-1001'} title="Loan Statement" />
                    </td>
                  </tr>
                ))}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-slate-400">
                      No active loans found. Issue a new loan to populate the ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Auto-Calculating Loan Application Form */}
      {activeTab === 'issuing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Left Side */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <PlusCircle className="w-5 h-5 text-brand-500" />
              Issue New Loan (Live Calculation Engine)
            </h2>

            <form onSubmit={handleIssueLoanSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Select Customer Borrower *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.fullName || c.name} ({c.phone}) - {c.nicNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Select Loan Policy Scheme *</label>
                <select
                  required
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold text-brand-600 dark:text-brand-400"
                >
                  <option value="">-- Choose Policy --</option>
                  {policies.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.policyName} ({p.interestRate}% {p.interestType} - {p.durationMonths} Months)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Principal Loan Amount ($) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  placeholder="e.g. 5000.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Collateral / Security Details</label>
                <textarea
                  rows={2}
                  value={collateralDetails}
                  onChange={(e) => setCollateralDetails(e.target.value)}
                  placeholder="Property deed, guarantor NIC, or vehicle RC details"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLoan || !calculation}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {submittingLoan ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Approve & Disburse Loan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Math Breakdown Panel (Right Side) */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl flex flex-col justify-between border-2 border-brand-500/30">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <Calculator className="w-5 h-5 text-brand-500" />
                Live Calculation Breakdown
              </h3>

              {calculating ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Computing financial math...</span>
                </div>
              ) : calculation ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-center">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Monthly EMI Settlement</span>
                    <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
                      ${calculation.monthlyInstallment.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Due every month for {calculation.durationMonths} months</span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Applied Scheme</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{calculation.policyName}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Interest Calculation</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{calculation.annualRate}% {calculation.interestType}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Principal Requested</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${calculation.principalAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Total Calculated Interest</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">+${calculation.totalInterest.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between py-2 text-sm">
                      <span className="font-bold text-slate-900 dark:text-white">Total Payable Amount</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${calculation.totalPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <Calculator className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>Select a Policy and enter a Principal Amount to view live EMI & interest calculations.</p>
                </div>
              )}
            </div>

            <div className="pt-4 text-[11px] text-slate-400 text-center">
              Powered by Microfinance Financial Calculation Engine.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Policy Management (Admin Only) */}
      {activeTab === 'policies' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Policy Form */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-brand-500" />
              Create Loan Policy
            </h2>

            <form onSubmit={handleCreatePolicySubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Policy Scheme Name *</label>
                <input
                  type="text"
                  name="policyName"
                  required
                  value={policyForm.policyName}
                  onChange={handlePolicyFormChange}
                  placeholder="e.g. Small Business (12% Flat)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Annual Rate (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="interestRate"
                    required
                    value={policyForm.interestRate}
                    onChange={handlePolicyFormChange}
                    placeholder="12.5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    name="durationMonths"
                    required
                    value={policyForm.durationMonths}
                    onChange={handlePolicyFormChange}
                    placeholder="12"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Interest Math Formula *</label>
                <select
                  name="interestType"
                  value={policyForm.interestType}
                  onChange={handlePolicyFormChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Flat">Flat Rate Interest</option>
                  <option value="Reducing Balance">Reducing Balance Interest</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={policyForm.description}
                  onChange={handlePolicyFormChange}
                  placeholder="Target audience or special conditions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPolicy}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingPolicy ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Save Loan Policy
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing Policies List */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" />
              Configured Loan Schemes ({policies.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {policies.map((p) => (
                <div key={p._id} className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{p.policyName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                      {p.interestType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.description || 'Standard microfinance loan scheme.'}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60 font-semibold">
                    <span>Rate: <strong className="text-brand-600 dark:text-brand-400">{p.interestRate}% p.a.</strong></span>
                    <span>Duration: <strong className="text-slate-800 dark:text-slate-200">{p.durationMonths} Months</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
