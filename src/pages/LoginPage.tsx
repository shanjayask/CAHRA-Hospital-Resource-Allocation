import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Eye, EyeOff, Lock, User, ArrowRight, AlertCircle,
  Users, Bed, HeartPulse, Stethoscope, Wind, ArrowDown, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server.',
      );
      return;
    }
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(identifier, password, remember);
      navigate('/command-center');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-50 grid-bg flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="relative max-w-md mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">AI Hospital Command Center</h1>
              <p className="text-xs text-navy-300">Constraint-Aware Multimodal AI</p>
            </div>
          </div>

          <h2 className="font-display font-bold text-3xl tracking-tight leading-tight mb-2">
            Hospital Resource Network
          </h2>
          <p className="text-navy-300 text-sm mb-8">
            Patient demand propagates through beds, ICU, staffing, and ventilators —
            the AI predicts, explains, and recommends before constraints collide.
          </p>

          {/* Demand cascade visual */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Users className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-medium flex-1">Patient Demand</span>
              <span className="font-display font-bold text-lg">100</span>
            </div>
            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-navy-400" /></div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Bed className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-medium flex-1">General Beds</span>
              <span className="font-display font-bold text-lg">82 / 96</span>
            </div>
            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-navy-400" /></div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <HeartPulse className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-medium flex-1">ICU Pressure</span>
              <span className="font-display font-bold text-lg text-amber-300">22 / 20</span>
            </div>
            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-navy-400" /></div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Wind className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-medium flex-1">Ventilator Demand</span>
              <span className="font-display font-bold text-lg">15 / 18</span>
            </div>
          </div>

          {/* Staffing cascade */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Stethoscope className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-medium flex-1">Nurse Load</span>
              <span className="font-display font-bold text-lg text-amber-300">68 / 60</span>
            </div>
            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-navy-400" /></div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Stethoscope className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-medium flex-1">Doctor Load</span>
              <span className="font-display font-bold text-lg">24 / 28</span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-navy-400">
            <span className="pill bg-white/10 text-white text-[10px] uppercase tracking-widest">Predict</span>
            <span className="text-navy-500">→</span>
            <span className="pill bg-white/10 text-white text-[10px] uppercase tracking-widest">Explain</span>
            <span className="text-navy-500">→</span>
            <span className="pill bg-white/10 text-white text-[10px] uppercase tracking-widest">Check</span>
            <span className="text-navy-500">→</span>
            <span className="pill bg-white/10 text-white text-[10px] uppercase tracking-widest">Act</span>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-navy-900">AI Hospital Command Center</h1>
              <p className="text-[10px] text-navy-400">Constraint-Aware Multimodal AI</p>
            </div>
          </div>

          <h2 className="font-display font-bold text-2xl text-navy-900 tracking-tight">Secure Command Center Access</h2>
          <p className="text-sm text-navy-500 mt-1 mb-8">Sign in with your hospital Supabase account.</p>

          {/* Supabase not configured warning */}
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Supabase Not Configured</p>
                <p className="text-xs text-amber-700 mt-1">
                  Add <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                  <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to{' '}
                  <code className="bg-amber-100 px-1 rounded">.env</code>, then restart the dev server.
                  See <code className="bg-amber-100 px-1 rounded">supabase/setup_users.js</code> to create initial users.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
                Email or Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@hospital.ai or admin"
                  disabled={!isSupabaseConfigured || loading}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-navy-100 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={!isSupabaseConfigured || loading}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-navy-100 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-navy-600"
                />
                <span className="text-sm text-navy-600">Remember session</span>
              </label>
              <button
                type="button"
                onClick={() => setError('Use the Supabase dashboard to reset passwords: Authentication → Users.')}
                className="text-sm text-navy-500 hover:text-navy-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isSupabaseConfigured || loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-navy-900 text-white rounded-xl font-display font-semibold text-sm hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in…' : 'Login'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-xs text-navy-400 text-center mt-6">
            CAHRA — Constraint-Aware Multimodal AI · Hospital Resource Allocation
          </p>
        </div>
      </div>
    </div>
  );
}
