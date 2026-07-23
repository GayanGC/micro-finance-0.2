import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Construction, ShieldAlert } from 'lucide-react';

const PlaceholderView = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <div className="glass-panel p-8 rounded-3xl text-center space-y-4 animate-fade-in max-w-3xl mx-auto my-6">
      <div className="w-16 h-16 bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto">
        <Construction className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        {title} Module
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        {subtitle || `This section is part of Phase 2 feature expansion. Logged in as ${user?.role}.`}
      </p>
      <div className="pt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <ShieldAlert className="w-3.5 h-3.5 text-brand-500" />
        RBAC Verified for {user?.role} Role
      </div>
    </div>
  );
};

export default PlaceholderView;
