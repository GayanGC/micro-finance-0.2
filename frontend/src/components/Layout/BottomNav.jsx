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
} from 'lucide-react';

const BottomNav = () => {
  const { user } = useAuth();
  const role = user?.role || 'Customer';

  const getNavItems = () => {
    switch (role) {
      case 'Admin':
        return [
          { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Staff', path: '/employees', icon: Users },
          { name: 'Clients', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          { name: 'Reports', path: '/reports', icon: BarChart3 },
        ];
      case 'Agent':
        return [
          { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Clients', path: '/customers', icon: UserCheck },
          { name: 'Loans', path: '/loans', icon: CreditCard },
          { name: 'Collect', path: '/collections', icon: History },
        ];
      case 'Customer':
        return [
          { name: 'Profile', path: '/profile', icon: User },
          { name: 'Loans', path: '/active-loans', icon: CreditCard },
          { name: 'Settlements', path: '/settlements', icon: CalendarCheck },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 pb-safe">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 min-w-[64px] rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500/20' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-[70px]">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
