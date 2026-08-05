import React from 'react';
import { Lock, Crown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeatureLockOverlay = ({ featureTitle = 'Pro & Enterprise Feature', minPackage = 'Standard (Pro)' }) => {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center p-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 shadow-2xl border border-amber-200 dark:border-amber-800 backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 uppercase tracking-wide">
            <Crown className="w-3.5 h-3.5 text-amber-500" /> Locked on Lite Plan
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3">
            {featureTitle} is Locked
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            This module requires a <strong>{minPackage}</strong> or higher SaaS subscription package. Upgrade your organization plan to unlock full automated operations.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition"
          >
            Upgrade Plan in Settings <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureLockOverlay;
