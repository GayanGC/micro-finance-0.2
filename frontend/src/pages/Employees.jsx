import React, { useState, useEffect } from 'react';
import { getEmployeesApi, registerEmployeeApi } from '../services/api';
import {
  Users,
  UserPlus,
  CalendarCheck,
  Clock,
  DollarSign,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';

const Employees = () => {
  const [activeTab, setActiveTab] = useState('directory');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'Agent',
    basicSalary: '',
    department: 'Field Operations',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployeesApi();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
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
    setSubmitting(true);

    try {
      const res = await registerEmployeeApi({
        ...formData,
        basicSalary: Number(formData.basicSalary),
      });
      setMessage({ type: 'success', text: res.message || 'Employee registered successfully!' });
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: 'Agent',
        basicSalary: '',
        department: 'Field Operations',
      });
      fetchEmployees();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to register employee.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-500" />
            Employee Management Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register employees, manage payroll, statutory EPF/ETF compliance, attendance & leave.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'directory', label: 'Employee Directory & Registration', icon: Users },
          { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck },
          { id: 'leave', label: 'Leave Management', icon: Clock },
          { id: 'payroll', label: 'Payroll & Salaries', icon: DollarSign },
          { id: 'etf_epf', label: 'Statutory ETF / EPF Module', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Directory & Registration Form */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Form (Left Column) */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-brand-500" />
              Employee Registration
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
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. David Rathnayake"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="david@microfinance.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">Basic Salary ($) *</label>
                  <input
                    type="number"
                    name="basicSalary"
                    required
                    value={formData.basicSalary}
                    onChange={handleInputChange}
                    placeholder="750.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Field Collections"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Employee
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Directory Table (Right Column) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              Active Staff Directory ({employees.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Employee</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Basic Salary</th>
                    <th className="px-4 py-3 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(Array.isArray(employees) ? employees : []).map((emp, idx) => (
                    <tr key={emp?._id || emp?.email || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {emp?.fullName || emp?.name || 'N/A'}
                        <div className="text-[11px] font-normal text-slate-400">{emp?.email || ''} {emp?.phone ? `• ${emp.phone}` : ''}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                          emp?.role === 'Admin'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {emp?.role || 'Agent'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{emp?.department || 'Field Operations'}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">${(emp?.basicSalary || 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          {emp?.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-400">
                        No employees registered yet. Use the registration form to add your first employee.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Daily Attendance Placeholder */}
      {activeTab === 'attendance' && (
        <div className="glass-panel p-8 rounded-3xl space-y-4 text-center">
          <div className="w-14 h-14 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Attendance Log</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Biometric and mobile check-in logging for field collection agents with GPS location verification.
          </p>
        </div>
      )}

      {/* TAB 3: Leave Management Placeholder */}
      {activeTab === 'leave' && (
        <div className="glass-panel p-8 rounded-3xl space-y-4 text-center">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Leave Application & Approval</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Annual, casual, and medical leave request approvals with automated balance calculations.
          </p>
        </div>
      )}

      {/* TAB 4: Payroll & Salaries Placeholder */}
      {activeTab === 'payroll' && (
        <div className="glass-panel p-8 rounded-3xl space-y-4 text-center">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <DollarSign className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payroll & Salary Disbursements</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Monthly salary processing, field performance commission incentives, and automated pay slip generation.
          </p>
        </div>
      )}

      {/* TAB 5: Statutory ETF / EPF Module Placeholder */}
      {activeTab === 'etf_epf' && (
        <div className="glass-panel p-8 rounded-3xl space-y-4 text-center">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Statutory ETF (3%) / EPF (12% + 8%) Module</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Compliant employer and employee statutory contribution breakdown reports and C-Form statement generation.
          </p>
        </div>
      )}
    </div>
  );
};

export default Employees;
