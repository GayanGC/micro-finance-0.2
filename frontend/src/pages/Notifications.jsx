import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  triggerOverdueAlertsApi,
  deleteNotificationApi,
} from '../services/api';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Zap,
  Filter,
  Send,
} from 'lucide-react';

const TYPE_CONFIG = {
  loan_approval: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  loan_rejection: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  overdue_7d: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  overdue_14d: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  overdue_30d: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  overdue_90d: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  payment_received: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  loan_completed: { icon: Zap, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  kyc_update: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  blacklist_alert: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  system: { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
};

const CHANNEL_COLORS = {
  SMS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  WhatsApp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Email: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'In-App': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Delivered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const Notifications = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  const isAdmin = ['Admin', 'super_admin'].includes(user?.role);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterStatus) filters.status = filterStatus;
      if (filterChannel) filters.channel = filterChannel;
      const result = await getNotificationsApi(filters);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterChannel]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => n._id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotificationApi(id);
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n._id !== id),
        unreadCount: Math.max(0, prev.unreadCount - (prev.notifications.find((n) => n._id === id)?.isRead === false ? 1 : 0)),
      }));
    } catch (e) {}
  };

  const handleTriggerOverdue = async () => {
    setTriggering(true);
    try {
      const result = await triggerOverdueAlertsApi();
      alert(`✅ ${result.message}`);
      fetchNotifications();
    } catch (e) {
      alert('Failed to trigger overdue scan.');
    } finally {
      setTriggering(false);
    }
  };

  const { notifications, unreadCount } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Automated alerts and system notifications</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={handleTriggerOverdue}
              disabled={triggering}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            >
              {triggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Trigger Overdue Scan
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Filter:</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="overdue_7d">7-Day Overdue</option>
          <option value="overdue_14d">14-Day Overdue</option>
          <option value="overdue_30d">30-Day Overdue</option>
          <option value="overdue_90d">90-Day Overdue</option>
          <option value="payment_received">Payment Received</option>
          <option value="loan_approval">Loan Approved</option>
          <option value="loan_rejection">Loan Rejected</option>
          <option value="loan_completed">Loan Completed</option>
          <option value="kyc_update">KYC Update</option>
          <option value="blacklist_alert">Blacklist Alert</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Sent">Sent</option>
          <option value="Delivered">Delivered</option>
          <option value="Failed">Failed</option>
        </select>
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Channels</option>
          <option value="SMS">SMS</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="In-App">In-App</option>
        </select>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Notifications Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">No alerts match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const typeConf = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
            const TypeIcon = typeConf.icon;
            return (
              <div
                key={notification._id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  !notification.isRead
                    ? 'bg-white dark:bg-slate-900 border-brand-200 dark:border-brand-800 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConf.bg}`}>
                  <TypeIcon className={`w-5 h-5 ${typeConf.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notification.title}
                        {!notification.isRead && <span className="ml-2 w-2 h-2 bg-brand-500 rounded-full inline-block" />}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLORS[notification.channel]}`}>
                        {notification.channel}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[notification.status]}`}>
                        {notification.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(notification.triggeredAt).toLocaleString()}
                      {notification.customerId && ` • ${notification.customerId.fullName || 'Customer'}`}
                    </p>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkRead(notification._id)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
