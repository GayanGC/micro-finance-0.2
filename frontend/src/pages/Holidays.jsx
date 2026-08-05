import React, { useState, useEffect, useCallback } from 'react';
import { getHolidaysApi, createHolidayApi, deleteHolidayApi } from '../services/api';
import {
  CalendarX2,
  PlusCircle,
  Trash2,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Tag,
  XCircle,
} from 'lucide-react';

import { useSubscription } from '../hooks/useSubscription';
import FeatureLockOverlay from '../components/Common/FeatureLockOverlay';

const TYPE_COLORS = {
  Holiday: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800',
  Skip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
};

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-xs';

const Holidays = () => {
  const { isLite } = useSubscription();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState({ type: '', text: '' });

  // Filter state
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterType, setFilterType] = useState('');

  // Form state
  const [form, setForm] = useState({
    date: '',
    name: '',
    type: 'Holiday',
    routeId: '',
  });

  // ── Helpers ──────────────────────────────────────────────────────────
  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterYear) filters.year = filterYear;
      if (filterType) filters.type = filterType;
      const data = await getHolidaysApi(filters);
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', 'Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterType]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.name) {
      showToast('error', 'Date and Name are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createHolidayApi(form);
      showToast('success', `"${form.name}" registered as a ${form.type}.`);
      setForm({ date: '', name: '', type: 'Holiday', routeId: '' });
      fetchHolidays();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to register holiday.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the holiday calendar?`)) return;
    setDeletingId(id);
    try {
      await deleteHolidayApi(id);
      showToast('success', `"${name}" removed.`);
      fetchHolidays();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete holiday.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (isLite) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarX2 className="w-7 h-7 text-brand-500" />
            Holiday &amp; Skip Day Plan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register public holidays and skip days with automated due date shifting.
          </p>
        </div>
        <FeatureLockOverlay featureTitle="Automated Holiday &amp; Skip Day Planner" minPackage="Standard (Pro)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarX2 className="w-7 h-7 text-brand-500" />
          Holiday &amp; Skip Day Plan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register public holidays and skip days. Loan due dates that fall on these days are automatically
          shifted to the next available working day.
        </p>
      </div>

      {/* Toast */}
      {toast.text && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
              : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Add Form ──────────────────────────────────────── */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <PlusCircle className="w-5 h-5 text-brand-500" />
            Add Holiday / Skip Day
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            {/* Date */}
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                required
                value={form.date}
                onChange={handleFormChange}
                className={INPUT_CLS}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                Holiday Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. National Independence Day"
                className={INPUT_CLS}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className={INPUT_CLS}
              >
                <option value="Holiday">Holiday (Public / National)</option>
                <option value="Skip">Skip Day (Route-Specific)</option>
              </select>
            </div>

            {/* Route ID (optional — only relevant for Skip) */}
            {form.type === 'Skip' && (
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" /> Route / Center ID
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="routeId"
                  value={form.routeId}
                  onChange={handleFormChange}
                  placeholder="e.g. CENTER-A or leave blank for all"
                  className={INPUT_CLS}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  Register Holiday
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-2 p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-[11px] text-brand-700 dark:text-brand-300">
            <p className="font-semibold mb-1">How date shifting works:</p>
            <ul className="space-y-0.5 list-disc list-inside text-brand-600 dark:text-brand-400">
              <li>Loan due dates are checked at creation &amp; schedule generation.</li>
              <li>If a date falls on a registered Holiday or Skip Day, it is automatically advanced to the next working day.</li>
              <li>Shifted dates are flagged with an <strong>originalDueDate</strong> in the amortization schedule.</li>
            </ul>
          </div>
        </div>

        {/* ── Right: Table ────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          {/* Table header + filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarX2 className="w-5 h-5 text-brand-500" />
              Registered Holidays ({holidays.length})
            </h2>
            <div className="flex items-center gap-2">
              {/* Year filter */}
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Types</option>
                <option value="Holiday">Holiday</option>
                <option value="Skip">Skip</option>
              </select>
              {/* Refresh */}
              <button
                onClick={fetchHolidays}
                disabled={loading}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading holidays…</span>
            </div>
          ) : holidays.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm space-y-2">
              <CalendarX2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p>No holidays registered for {filterYear}.</p>
              <p className="text-xs">Use the form on the left to add public holidays or skip days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">#</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Holiday Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Route / Center</th>
                    <th className="px-4 py-3 rounded-r-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {holidays.map((h, idx) => (
                    <tr
                      key={h._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDate(h.date)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {h.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${TYPE_COLORS[h.type] || TYPE_COLORS.Holiday}`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {h.routeId || <span className="italic text-slate-300 dark:text-slate-600">All Routes</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(h._id, h.name)}
                          disabled={deletingId === h._id}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 font-semibold text-[11px] transition disabled:opacity-50"
                        >
                          {deletingId === h._id ? (
                            <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Holidays;
