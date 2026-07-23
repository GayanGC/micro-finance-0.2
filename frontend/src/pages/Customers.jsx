import React, { useState, useEffect } from 'react';
import { getCustomersApi, registerCustomerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  UserPlus,
  Phone,
  Shield,
  MapPin,
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound
} from 'lucide-react';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Customer Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pin: '',
    address: '',
    nicNumber: '',
    kycStatus: 'Verified',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomersApi();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.pin.length < 4 || formData.pin.length > 6) {
      setMessage({ type: 'error', text: 'PIN must be between 4 and 6 digits.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await registerCustomerApi(formData);
      setMessage({ type: 'success', text: res.message || 'Customer registered successfully!' });
      setFormData({
        fullName: '',
        phone: '',
        pin: '',
        address: '',
        nicNumber: '',
        kycStatus: 'Verified',
      });
      fetchCustomers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to register customer.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter((c) => {
    const nameStr = (c?.fullName || c?.name || '').toLowerCase();
    const phoneStr = (c?.phone || '').toLowerCase();
    const nicStr = (c?.nicNumber || c?.nic || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();

    return (
      nameStr.includes(query) ||
      phoneStr.includes(query) ||
      nicStr.includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-brand-500" />
          Customer Management Portal (Dual Auth)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register clients, manage identity verification (KYC), and assign 4-6 digit security PINs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Registration Form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <UserPlus className="w-5 h-5 text-brand-500" />
            New Customer Registration
          </h2>

          {message.text && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Customer Full Name *</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="e.g. Anura Wickramasinghe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Phone Number (Login ID) *</label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+94 71 987 6543"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-brand-500" /> Security PIN *
                </label>
                <input
                  type="password"
                  name="pin"
                  required
                  maxLength={6}
                  value={formData.pin}
                  onChange={handleInputChange}
                  placeholder="4-6 Digits"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">NIC / ID Number *</label>
                <input
                  type="text"
                  name="nicNumber"
                  required
                  value={formData.nicNumber}
                  onChange={handleInputChange}
                  placeholder="199082301928"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Residential Address *</label>
              <textarea
                name="address"
                required
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
                placeholder="No. 88, Lake Road, Colombo 03"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">KYC Verification Status</label>
              <select
                name="kycStatus"
                value={formData.kycStatus}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="Verified">Verified (Instant Approval)</option>
                <option value="Pending">Pending Audit</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Customer Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Customer Directory Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-500" />
              Registered Borrowers Directory ({filteredCustomers.length})
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, NIC..."
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Customer</th>
                  <th className="px-4 py-3">Phone / Auth ID</th>
                  <th className="px-4 py-3">NIC Number</th>
                  <th className="px-4 py-3">KYC Status</th>
                  <th className="px-4 py-3 rounded-r-xl">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCustomers.map((cust, idx) => (
                  <tr key={cust._id || cust.phone || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {cust?.fullName || cust?.name || 'N/A'}
                      <div className="text-[11px] font-normal text-slate-400 truncate max-w-[200px]">{cust?.address || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{cust?.phone || 'N/A'}</td>
                    <td className="px-4 py-3.5 font-medium">{cust?.nicNumber || cust?.nic || 'N/A'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold ${
                          cust?.kycStatus === 'Verified'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : cust?.kycStatus === 'Pending'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {cust?.kycStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {cust?.registeredBy?.name || user?.name || 'System Agent'}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-400">
                      No matching customer accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
