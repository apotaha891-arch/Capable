import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { API_BASE as API } from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { lang } = useLang();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
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
          <h1 className="text-xl font-bold text-white mb-2 text-center">
            {lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
          </h1>
          <p className="text-center text-sm text-slate-400 mb-6">
            {lang === 'ar'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
              : "Enter your email and we'll send you a link to reset your password."}
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mb-5 text-red-300 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          {sent ? (
            <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700 rounded-xl px-4 py-3 text-emerald-300 text-sm">
              <CheckCircle2 size={15} className="shrink-0" />
              {lang === 'ar'
                ? 'إذا كان هذا البريد مسجلاً لدينا، فسيصلك رابط إعادة التعيين قريباً.'
                : "If that email is registered, you'll receive a reset link shortly."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === 'ar' ? 'جارٍ الإرسال…' : 'Sending…'}</>
                ) : (
                  lang === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send reset link'
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
