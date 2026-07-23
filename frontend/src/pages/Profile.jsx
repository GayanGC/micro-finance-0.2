import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Shield, Calendar, Key, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-500/20 border-4 border-white dark:border-slate-800">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {user?.name || 'User Profile'}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {user?.role || 'Customer'} Account
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Active Status
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 pt-1">
              Member ID: #{user?._id?.substring(0, 10) || 'MF-2026-001'}
            </p>
          </div>
        </div>
      </div>

      {/* Account Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-brand-500" /> Personal Details
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Full Name</label>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <User className="w-4 h-4 text-slate-400" /> {user?.name || 'N/A'}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Email Address</label>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <Mail className="w-4 h-4 text-slate-400" /> {user?.email || 'N/A'}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Phone Number</label>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <Phone className="w-4 h-4 text-slate-400" /> {user?.phone || '+1 (555) 019-2831'}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Registered Address</label>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <MapPin className="w-4 h-4 text-slate-400" /> {user?.address || 'Main District Branch, City Center'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-brand-500" /> Security & Role Access
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Assigned Role</label>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <Key className="w-4 h-4 text-slate-400" /> {user?.role} (RBAC Protected)
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Session Security</label>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-0.5">
                <CheckCircle className="w-4 h-4" /> JWT Signed Token Valid
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Last Login</label>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Today (Active Session)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
