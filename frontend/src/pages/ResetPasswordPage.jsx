import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { API_BASE as API } from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { lang } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
      setTimeout(() => navigate('/auth', { replace: true }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex justify-center mb-8">
          <Logo to="/" size="lg" appearance="dark" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-6 text-center">
            {lang === 'ar' ? 'اختر كلمة مرور جديدة' : 'Choose a new password'}
          </h1>

          {!token && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {lang === 'ar' ? 'رابط إعادة التعيين غير صالح أو مفقود.' : 'This reset link is invalid or missing.'}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          {done ? (
            <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700 rounded-xl px-4 py-3 text-emerald-300 text-sm">
              <CheckCircle2 size={15} className="shrink-0" />
              {lang === 'ar' ? 'تم تحديث كلمة المرور. جارٍ التوجيه لتسجيل الدخول…' : 'Password updated. Redirecting to sign in…'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}
                  required
                  disabled={!token}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 ps-9 pe-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm disabled:opacity-50"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative">
                <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm new password'}
                  required
                  disabled={!token}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 ps-9 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…'}</>
                ) : (
                  lang === 'ar' ? 'حفظ كلمة المرور' : 'Save new password'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link to="/auth" className="text-indigo-400 hover:underline">
            {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
