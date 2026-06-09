import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../i18n/LangContext.jsx';
import Logo from '../components/Logo.jsx';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  // Preserve the full target (path + query + hash), not just the pathname, so a
  // gated link like /builder?from=34 survives the sign-in round-trip.
  const fromLoc = location.state?.from;
  const from = fromLoc
    ? `${fromLoc.pathname || ''}${fromLoc.search || ''}${fromLoc.hash || ''}`
    : '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (password.length < 6) throw new Error(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
        await register(email, name, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo to="/" size="lg" appearance="dark" />
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-8">
            {[['login', lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'], ['register', lang === 'ar' ? 'إنشاء حساب' : 'Sign Up']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="text-xl font-bold text-white mb-6 text-center">
            {mode === 'login'
              ? (lang === 'ar' ? 'مرحباً بعودتك 👋' : 'Welcome back 👋')
              : (lang === 'ar' ? 'أنشئ حسابك 🚀' : 'Create your account 🚀')}
          </h1>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 ps-9 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 ps-9 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 ps-9 pe-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</>
              ) : (
                mode === 'login'
                  ? (lang === 'ar' ? 'دخول' : 'Sign In')
                  : (lang === 'ar' ? 'إنشاء الحساب' : 'Create Account')
              )}
            </button>
          </form>

          {/* Plan info */}
          {mode === 'register' && (
            <p className="text-center text-xs text-slate-500 mt-5">
              {lang === 'ar'
                ? '✅ الخطة المجانية تشمل 50,000 توكن شهرياً'
                : '✅ Free plan includes 50,000 tokens/month'}
            </p>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {lang === 'ar' ? 'بالمتابعة توافق على ' : 'By continuing you agree to our '}
          <span className="text-indigo-400 cursor-pointer hover:underline">
            {lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
          </span>
        </p>
      </div>
    </div>
  );
}
