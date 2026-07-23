import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Lock,
  Mail,
  Sun,
  Moon,
  ArrowRight,
  UserCheck,
  Building,
  User,
  AlertCircle
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);

  const { login, quickDemoLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.data.role === 'Customer') {
        navigate('/profile', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(result.message);
    }
  };

  const handleDemoLogin = async (e, role) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setError('');
    setActiveDemoRole(role);
    setLoading(true);

    const demoCredentials = {
      Admin: { email: 'admin@microfinance.com', password: 'password123' },
      Agent: { email: 'agent@microfinance.com', password: 'password123' },
      Customer: { email: 'customer@microfinance.com', password: 'password123' },
    };

    if (demoCredentials[role]) {
      setEmail(demoCredentials[role].email);
      setPassword(demoCredentials[role].password);
    }

    const result = await quickDemoLogin(role);
    setLoading(false);
    setActiveDemoRole(null);

    if (result && result.success) {
      if (role === 'Customer') {
        navigate('/profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result?.message || `Failed to log in as ${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Background Glow / Blur Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header with Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white/10 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 text-white hover:bg-white/20 transition-all shadow-lg"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Brand Header Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-2xl shadow-brand-500/40 ring-4 ring-white/10">
            <Shield className="w-9 h-9 text-white" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          MicroFinance Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secure Role-Based Financial Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-300 text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address or Phone Number
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@microfinance.com or +1 (555) 019-2831"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-brand-500/25 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading && !activeDemoRole ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Role-Based Quick Demo Login Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Quick Demo Access (Select Role)
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={(e) => handleDemoLogin(e, 'Admin')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-200 transition-all text-xs font-medium focus:outline-none"
              >
                {loading && activeDemoRole === 'Admin' ? (
                  <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin my-1" />
                ) : (
                  <>
                    <Building className="w-5 h-5 mb-1 text-purple-400" />
                    <span>Admin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleDemoLogin(e, 'Agent')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-200 transition-all text-xs font-medium focus:outline-none"
              >
                {loading && activeDemoRole === 'Agent' ? (
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin my-1" />
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mb-1 text-blue-400" />
                    <span>Agent</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleDemoLogin(e, 'Customer')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-200 transition-all text-xs font-medium focus:outline-none"
              >
                {loading && activeDemoRole === 'Customer' ? (
                  <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin my-1" />
                ) : (
                  <>
                    <User className="w-5 h-5 mb-1 text-emerald-400" />
                    <span>Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
