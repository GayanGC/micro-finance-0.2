import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystemMode } from '../../context/SystemModeContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  User,
  History,
  CalendarCheck,
  X,
  Sparkles,
  Bell,
  ShieldCheck,
  GitBranch,
  Settings,
  FileText,
  AlertTriangle,
  Banknote,
  CalendarX2,
  BookOpen,
} from 'lucide-react';

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const { isEnterprise, config } = useSystemMode();
  const role = user?.role || 'Customer';

  const getNavItems = () => {
    switch (role) {
      case 'Admin':
      case 'super_admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Employees', path: '/employees', icon: Users },
          { name: 'Customers', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          ...(isEnterprise ? [{ name: 'Approvals', path: '/approvals', icon: GitBranch, badge: 'NEW' }] : []),
          ...(isEnterprise ? [{ name: 'Risk Management', path: '/risk-management', icon: AlertTriangle }] : []),
          { name: 'Collections', path: '/collections', icon: History },
          { name: 'Bulk Collections', path: '/bulk-collections', icon: Banknote, badge: 'NEW' },
          ...(config.notificationsEnabled ? [{ name: 'Notifications', path: '/notifications', icon: Bell }] : []),
          { name: 'Reports', path: '/reports', icon: BarChart3 },
          { name: 'Accounting', path: '/chart-of-accounts', icon: BookOpen },
          ...(isEnterprise && config.auditLogsEnabled ? [{ name: 'Audit Logs', path: '/audit-logs', icon: FileText }] : []),
          { name: 'Holiday Plan', path: '/holidays', icon: CalendarX2 },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'Agent':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Customers', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          ...(isEnterprise ? [{ name: 'Approvals', path: '/approvals', icon: GitBranch, badge: 'NEW' }] : []),
          { name: 'Collections', path: '/collections', icon: History },
          { name: 'Bulk Collections', path: '/bulk-collections', icon: Banknote, badge: 'NEW' },
          ...(config.notificationsEnabled ? [{ name: 'Notifications', path: '/notifications', icon: Bell }] : []),
        ];
      case 'credit_officer':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Customers', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          { name: 'Approvals', path: '/approvals', icon: GitBranch, badge: 'NEW' },
          { name: 'Accounting', path: '/chart-of-accounts', icon: BookOpen },
          { name: 'Risk Management', path: '/risk-management', icon: AlertTriangle },
          ...(config.notificationsEnabled ? [{ name: 'Notifications', path: '/notifications', icon: Bell }] : []),
        ];
      case 'auditor':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Reports', path: '/reports', icon: BarChart3 },
          { name: 'Accounting', path: '/chart-of-accounts', icon: BookOpen },
          { name: 'Risk Management', path: '/risk-management', icon: AlertTriangle },
          { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
          ...(config.notificationsEnabled ? [{ name: 'Notifications', path: '/notifications', icon: Bell }] : []),
        ];
      case 'Customer':
        return [
          { name: 'My Profile', path: '/profile', icon: User },
          { name: 'My Active Loans', path: '/active-loans', icon: CreditCard },
          { name: 'Monthly Settlements', path: '/settlements', icon: CalendarCheck },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleBadgeStyle = () => {
    switch (role) {
      case 'Admin':
      case 'super_admin':
        return 'text-purple-700 dark:text-purple-300';
      case 'Agent':
        return 'text-blue-700 dark:text-blue-300';
      case 'credit_officer':
        return 'text-amber-700 dark:text-amber-300';
      case 'auditor':
        return 'text-teal-700 dark:text-teal-300';
      case 'Customer':
        return 'text-emerald-700 dark:text-emerald-300';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'credit_officer': return 'Credit Officer';
      case 'auditor': return 'Auditor';
      default: return role;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Sidebar Header */}
      <div className="mb-4 px-3 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
            Navigation Portal
          </span>
          <h3 className={`text-sm font-bold capitalize flex items-center gap-1.5 mt-0.5 ${getRoleBadgeStyle()}`}>
            <Sparkles className="w-4 h-4" />
            {getRoleLabel()} Workspace
          </h3>
        </div>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* System Mode Badge */}
      <div className="mb-4 px-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
          isEnterprise
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {isEnterprise ? 'Enterprise Mode' : 'Lite Mode'}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => mobileOpen && onCloseMobile()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-100/50 dark:from-slate-800/80 dark:to-slate-900/80 border border-brand-200/60 dark:border-slate-700/60 text-xs">
        <div className="font-semibold text-brand-900 dark:text-brand-300">MicroFinance v2.0</div>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isEnterprise ? '🏢 Enterprise — Full feature set active.' : '⚡ Lite — Simplified workflow active.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-64 bg-white/70 dark:bg-slate-900/70 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative flex-1 max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl h-full z-10 overflow-y-auto animate-slide-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
