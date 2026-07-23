import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles
} from 'lucide-react';

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role || 'Customer';

  // Navigation Links based on RBAC requirements
  const getNavItems = () => {
    switch (role) {
      case 'Admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Employees', path: '/employees', icon: Users },
          { name: 'Customers', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          { name: 'Reports', path: '/reports', icon: BarChart3 },
        ];
      case 'Agent':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Customers', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          { name: 'Collections', path: '/collections', icon: History },
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

  const sidebarContent = (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Sidebar Header / Role Tag */}
      <div className="mb-6 px-3 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
            Navigation Portal
          </span>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-1.5 mt-0.5">
            <Sparkles className="w-4 h-4 text-brand-500" />
            {role} Workspace
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

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => mobileOpen && onCloseMobile()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-100/50 dark:from-slate-800/80 dark:to-slate-900/80 border border-brand-200/60 dark:border-slate-700/60 text-xs">
        <div className="font-semibold text-brand-900 dark:text-brand-300">Microfinance v1.0</div>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Mobile-responsive & secure RBAC enabled.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-64 bg-white/70 dark:bg-slate-900/70 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0">
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
          <div className="relative flex-1 max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl h-full z-10 animate-slide-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
