import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Auth: React.FC = () => {
  const { signIn, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationRequired(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMessage(error.message);
        }
      } else {
        const { error, needsEmailVerification } = await signUp(
          email.trim(),
          password,
          fullName.trim() || email.split('@')[0]
        );

        if (error) {
          setErrorMessage(error.message);
        } else if (needsEmailVerification) {
          setVerificationRequired(true);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Configuration Missing Banner */}
      {!isConfigured && (
        <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Supabase Credentials Required</span>
          </div>
          <p className="leading-relaxed">
            Please add your Supabase project credentials to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-100 font-mono">frontend/.env</code>:
          </p>
          <pre className="p-2 bg-slate-950/80 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
            VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
            VITE_SUPABASE_ANON_KEY=your-anon-key
          </pre>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 text-white shadow-xl shadow-teal-500/20 mb-2">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            SPENDWISE
          </h1>
          <p className="text-xs text-teal-400 font-medium tracking-wide uppercase">
            Budget & Decision Support
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' ? 'Sign in to access your personal financial dashboard' : 'Create an account to start tracking your student budget'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-2xl border border-slate-700/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Verification Alert */}
        {verificationRequired && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Verification Email Sent!</span>
            </div>
            <p className="leading-relaxed">
              We sent a confirmation link to <span className="font-semibold text-white">{email}</span>. Please verify your email, then return here to log in.
            </p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Nihal Nayak"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@college.edu or personal email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must be at least 6 characters
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights */}
        <div className="pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Decision Support</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Strict Data Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
