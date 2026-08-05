import React, { useState, useEffect } from 'react';
import { getPortalProfileApi } from '../../services/api';
import {
  User,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getPortalProfileApi();
      setProfile(data);
    } catch (err) {
      console.error('Error loading customer portal profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const score = profile?.creditScore || 75;
  const kycStatus = profile?.kycStatus || 'Verified';
  const riskTag = profile?.riskTag || 'Low';
  const cribTier = profile?.cribTier || 'A';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Verified Borrower Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {profile?.fullName || 'Valued Borrower'}!
            </h1>
            <p className="mt-2 text-brand-200 text-sm max-w-xl">
              Access your personal account profile, internal credit score, assigned branch route, and identity verification status.
            </p>
          </div>

          <button
            onClick={fetchProfile}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Personal Profile (Left) & Credit Metrics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Information Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-brand-500" />
            Personal Details &amp; KYC Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Full Legal Name</span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm">{profile?.fullName || '—'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">NIC / Identity Number</span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm">{profile?.nicNumber || '—'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Phone Number</span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-500" /> {profile?.phone || '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Email Address</span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" /> {profile?.email || '—'}
              </span>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Residential Address</span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-500" /> {profile?.address || '—'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Branch Route Assignment</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                <span className="text-[10px] text-slate-400 block font-semibold">BRANCH</span>
                <span className="font-extrabold text-brand-700 dark:text-brand-300">{profile?.branch || 'HQ'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                <span className="text-[10px] text-slate-400 block font-semibold">CENTER</span>
                <span className="font-extrabold text-brand-700 dark:text-brand-300">{profile?.centerName || 'Center A'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                <span className="text-[10px] text-slate-400 block font-semibold">GROUP</span>
                <span className="font-extrabold text-brand-700 dark:text-brand-300">{profile?.groupName || 'Group 1'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Credit Score & Risk Gauge Card */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Award className="w-5 h-5 text-amber-500" />
              Internal Credit Health
            </h2>

            {/* Score Circle / Meter */}
            <div className="mt-4 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="relative w-28 h-28 rounded-full border-8 border-brand-500/20 border-t-brand-500 flex items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{score}</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> High Credit Rating
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-500 font-semibold">KYC Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  {kycStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-500 font-semibold">Risk Classification</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                  {riskTag} Risk
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="text-slate-500 font-semibold">CRIB Credit Rating</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                  Tier {cribTier}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300">
            <strong>Good Standing:</strong> You have an active high credit rating eligible for loan top-ups.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
