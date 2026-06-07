import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Inbox, Settings as SettingsIcon, ArrowLeft,
  Globe, Eye, Heart, Users, ExternalLink, Mail, Phone, MessageSquare, Pencil,
  HelpCircle, Upload, X as XIcon, Lock, Tag, EyeOff,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import { StatCard, Spinner, LineChart, tt } from '../admin/AdminShared.jsx';
import { siteUrl } from '../utils/site.js';
import { hostedUrl } from '../utils/api.js';

export default function ProjectPanel() {
  const { id } = useParams();
  const { t, lang, isRTL } = useLang();
  const { authFetch } = useAuth();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('overview');

  const loadProject = () => authFetch(`/api/projects/${id}`).then(r => r.json()).then(setProject).catch(() => setProject(false));
  useEffect(() => { loadProject(); }, [id]);

  if (project == null) return <div className="min-h-screen bg-slate-950"><Spinner /></div>;
  if (project === false) return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">{tt(lang, 'Project not found.', 'المشروع غير موجود.')}</div>;

  const liveUrl = project.blueprint
    ? siteUrl(project.published_slug)
    : hostedUrl(project.published_slug);

  const tabs = [
    { id: 'overview', label: tt(lang, 'Overview', 'نظرة عامة'), icon: LayoutDashboard },
    { id: 'analytics', label: tt(lang, 'Analytics', 'التحليلات'), icon: BarChart3 },
    { id: 'leads', label: tt(lang, 'Leads', 'العملاء المحتملون'), icon: Inbox },
    { id: 'settings', label: tt(lang, 'Settings', 'الإعدادات'), icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link to="/dashboard" className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
          </Link>
          <span className="font-bold text-lg text-white truncate">{project.name}</span>
          {project.is_published
            ? <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{tt(lang, 'Live', 'منشور')}</span>
            : <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{tt(lang, 'Draft', 'مسودة')}</span>}
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link to={project.blueprint ? `/blueprint/${id}` : `/editor/${id}`}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg">
            <Pencil size={14} /> {t('edit')}
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map(({ id: tid, label, icon: Icon }) => (
              <button key={tid} onClick={() => setTab(tid)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${tab === tid ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </aside>

        <section>
          {tab === 'overview' && <Overview project={project} liveUrl={liveUrl} lang={lang} authFetch={authFetch} reload={loadProject} />}
          {tab === 'analytics' && <Analytics id={id} lang={lang} authFetch={authFetch} />}
          {tab === 'leads' && <Leads id={id} lang={lang} authFetch={authFetch} />}
          {tab === 'settings' && <SettingsTab project={project} lang={lang} authFetch={authFetch} reload={loadProject} t={t} />}
        </section>
      </main>
    </div>
  );
}

function Overview({ project, liveUrl, lang, authFetch, reload }) {
  const [a, setA] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deployBlock, setDeployBlock] = useState(null); // { deploys_count, deploys_limit }
  useEffect(() => { authFetch(`/api/projects/${project.id}/analytics?days=14`).then(r => r.json()).then(setA).catch(() => setA(false)); }, [project.id]);

  const publish = async () => {
    setBusy(true); setDeployBlock(null);
    const res = await authFetch(`/api/projects/${project.id}/publish`, { method: 'POST' });
    setBusy(false);
    if (res.status === 402) {
      const d = await res.json().catch(() => ({}));
      if (d.error === 'deploy_limit_reached') { setDeployBlock(d); return; }
    }
    reload();
  };
  const buyDeploySlot = async () => {
    const res = await authFetch('/api/biz/deploy-slots', { method: 'POST', body: JSON.stringify({ quantity: 1 }) });
    const d = await res.json().catch(() => ({}));
    if (d.url) window.location.href = d.url;
  };
  const unpublish = async () => {
    setBusy(true);
    await authFetch(`/api/projects/${project.id}/unpublish`, { method: 'POST' });
    setBusy(false); reload();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Eye size={16} />} tone="indigo" label={tt(lang, 'Total Views', 'إجمالي المشاهدات')} value={a ? a.totalViews : '…'} sub={a ? tt(lang, `${a.viewsInRange} in 14 days`, `${a.viewsInRange} خلال ١٤ يوماً`) : ''} />
        <StatCard icon={<Inbox size={16} />} tone="emerald" label={tt(lang, 'Leads', 'العملاء المحتملون')} value={a ? a.leadsCount : '…'} />
        <StatCard icon={<Heart size={16} />} tone="rose" label={tt(lang, 'Likes', 'الإعجابات')} value={a ? a.likes : (project.likes || 0)} />
        <StatCard icon={<Globe size={16} />} tone="cyan" label={tt(lang, 'Status', 'الحالة')} value={project.is_published ? tt(lang, 'Live', 'منشور') : tt(lang, 'Draft', 'مسودة')} />
      </div>

      {/* Live link + publish controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">{tt(lang, 'Publishing', 'النشر')}</h3>
        {project.is_published ? (
          <div className="flex flex-wrap items-center gap-3">
            <a href={liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 bg-slate-800/60 px-3 py-2 rounded-lg break-all">
              <ExternalLink size={14} /> {liveUrl}
            </a>
            <button onClick={unpublish} disabled={busy} className="text-sm border border-slate-700 hover:border-amber-500 hover:text-amber-400 text-slate-300 px-4 py-2 rounded-lg">
              {tt(lang, 'Unpublish', 'إلغاء النشر')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-400">{tt(lang, 'This project is not live yet.', 'هذا المشروع غير منشور بعد.')}</p>
            <button onClick={publish} disabled={busy} className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-1.5">
              <Globe size={14} /> {tt(lang, 'Publish now', 'انشر الآن')}
            </button>
          </div>
        )}

        {deployBlock && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-2">
              <Lock size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200 leading-relaxed">
                {tt(lang,
                  `You've used all your deployable slots (${deployBlock.deploys_count}/${deployBlock.deploys_limit}). Add a slot for $5/mo, or upgrade your plan for more.`,
                  `استخدمت كل خانات النشر المتاحة (${deployBlock.deploys_count}/${deployBlock.deploys_limit}). أضف خانة مقابل ٥$ شهرياً، أو رقِّ باقتك للمزيد.`)}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={buyDeploySlot} className="text-sm bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg">
                {tt(lang, 'Add a deploy slot ($5/mo)', 'أضف خانة نشر (٥$ شهرياً)')}
              </button>
              <Link to="/influence" className="text-sm border border-slate-700 hover:border-indigo-500 hover:text-indigo-300 text-slate-300 px-4 py-2 rounded-lg">
                {tt(lang, 'Upgrade plan', 'ترقية الباقة')}
              </Link>
            </div>
          </div>
        )}
      </div>

      {a && a.series && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Visits — last 14 days', 'الزيارات — آخر ١٤ يوماً')}</h3>
          <LineChart data={a.series} />
        </div>
      )}
    </div>
  );
}

function Analytics({ id, lang, authFetch }) {
  const [a, setA] = useState(null);
  useEffect(() => { authFetch(`/api/projects/${id}/analytics?days=30`).then(r => r.json()).then(setA).catch(() => setA(false)); }, [id]);
  if (a == null) return <Spinner />;
  if (a === false) return <p className="text-slate-400">{tt(lang, 'Failed to load.', 'فشل التحميل.')}</p>;
  const totalDev = a.byDevice.reduce((s, d) => s + d.c, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Visits — last 30 days', 'الزيارات — آخر ٣٠ يوماً')}</h3>
        <LineChart data={a.series} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Top Sources', 'أهم المصادر')}</h3>
          {a.byReferrer.length === 0 ? <p className="text-sm text-slate-500">{tt(lang, 'No data yet.', 'لا توجد بيانات بعد.')}</p> : (
            <ul className="space-y-2">
              {a.byReferrer.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate">{r.r}</span>
                  <span className="text-slate-500">{r.c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">{tt(lang, 'Devices', 'الأجهزة')}</h3>
          {a.byDevice.length === 0 ? <p className="text-sm text-slate-500">{tt(lang, 'No data yet.', 'لا توجد بيانات بعد.')}</p> : (
            <div className="space-y-3">
              {a.byDevice.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="capitalize">{d.device}</span><span>{Math.round((d.c / totalDev) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(d.c / totalDev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Leads({ id, lang, authFetch }) {
  const [data, setData] = useState(null);
  useEffect(() => { load(); }, [id]);
  const load = () => authFetch(`/api/projects/${id}/leads`).then(r => r.json()).then(setData).catch(() => setData(false));
  const markRead = async (leadId) => {
    setData(d => ({ ...d, leads: d.leads.map(l => l.id === leadId ? { ...l, is_read: true } : l) }));
    await authFetch(`/api/projects/${id}/leads/${leadId}/read`, { method: 'POST' });
  };

  if (data == null) return <Spinner />;
  if (data === false) return <p className="text-slate-400">{tt(lang, 'Failed to load.', 'فشل التحميل.')}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{tt(lang, 'Leads Inbox', 'صندوق العملاء المحتملين')}</h2>
        {data.unread > 0 && <span className="text-xs bg-rose-500/15 text-rose-400 px-2 py-1 rounded-full">{data.unread} {tt(lang, 'new', 'جديد')}</span>}
      </div>
      {data.leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-slate-800 rounded-3xl text-center">
          <Inbox size={36} className="text-slate-600 mb-3" />
          <p className="text-slate-400">{tt(lang, 'No leads yet.', 'لا يوجد عملاء محتملون بعد.')}</p>
          <p className="text-xs text-slate-600 mt-1">{tt(lang, 'Form submissions from your live site appear here.', 'إرسالات النماذج من موقعك المنشور تظهر هنا.')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.leads.map(l => (
            <div key={l.id} onClick={() => !l.is_read && markRead(l.id)}
              className={`bg-slate-900 border rounded-2xl p-4 ${l.is_read ? 'border-slate-800' : 'border-indigo-600/40 bg-indigo-500/5 cursor-pointer'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{l.name || tt(lang, 'Anonymous', 'بدون اسم')}</span>
                    {!l.is_read && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                    {l.email && <span className="flex items-center gap-1"><Mail size={12} /> {l.email}</span>}
                    {l.phone && <span className="flex items-center gap-1"><Phone size={12} /> {l.phone}</span>}
                  </div>
                  {l.message && <p className="text-sm text-slate-300 mt-2 flex items-start gap-1.5"><MessageSquare size={13} className="mt-0.5 shrink-0 text-slate-500" /> {l.message}</p>}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// These three live at module scope (not inside SettingsTab) so their component
// identity is stable across renders. Defining them inside SettingsTab made every
// keystroke remount the inputs, which dropped focus after each character.

// Small clickable "?" that toggles a plain-language explanation for non-technical users.
function Hint({ id, text, openHint, setOpenHint, lang }) {
  return (
    <span className="inline-flex items-center flex-wrap">
      <button type="button" onClick={() => setOpenHint(o => (o === id ? null : id))}
        className="text-slate-500 hover:text-indigo-400 transition-colors align-middle"
        aria-label={tt(lang, 'What is this?', 'ما هذا؟')}>
        <HelpCircle size={13} />
      </button>
      {openHint === id && (
        <span className="block w-full basis-full mt-1 text-[11px] leading-relaxed text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-2">
          {text}
        </span>
      )}
    </span>
  );
}

// Lock chip shown next to paid-only features.
function PremiumBadge({ lang }) {
  return (
    <Link to="/dashboard?upgrade=1"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/25">
      <Lock size={10} /> {tt(lang, 'Upgrade', 'الباقات الأعلى')}
    </Link>
  );
}

// Labelled text/textarea field. value + onChange are passed in (not read from a
// closure) so the input identity stays stable and keeps focus while typing.
function Field({ label, value, onChange, ph, textarea, hintId, hintText, openHint, setOpenHint, lang }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
        {label}
        {hintText && <Hint id={hintId} text={hintText} openHint={openHint} setOpenHint={setOpenHint} lang={lang} />}
      </span>
      {textarea
        ? <textarea value={value} onChange={onChange} rows={3} placeholder={ph} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
        : <input value={value} onChange={onChange} placeholder={ph} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />}
    </label>
  );
}

function SettingsTab({ project, lang, authFetch, reload, t }) {
  const { user } = useAuth();
  // Premium features (custom domain, selling/cloning for a fee) are unlocked on
  // paid plans. Free users see a lock badge and the controls stay disabled.
  const canPremium = !!(user?.plan && user.plan !== 'free');

  const [form, setForm] = useState({
    name: project.name || '', description: project.description || '',
    seo_title: project.seo_title || '', seo_description: project.seo_description || '',
    og_image_url: project.og_image_url || '', custom_domain: project.custom_domain || '',
    is_public: !!project.is_public, price: project.price || 0,
  });
  const [saved, setSaved] = useState(false);
  const [openHint, setOpenHint] = useState(null);   // which field's help text is showing
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    await authFetch(`/api/projects/${project.id}`, { method: 'PUT', body: JSON.stringify(form) });
    setSaved(true); setTimeout(() => setSaved(false), 1800); reload();
  };

  // Upload the OG image straight from the user's computer — no hosting/URL needed.
  const uploadOgImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';                 // allow re-picking the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await authFetch(`/api/projects/${project.id}/og-image`, {
        method: 'POST', body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, og_image_url: data.url }));
    } finally {
      setUploading(false);
    }
  };

  // Shared props so the module-scope Hint/Field can reach this tab's state.
  const hintProps = { openHint, setOpenHint, lang };

  return (
    <form onSubmit={save} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl">
      <h2 className="text-lg font-bold text-white">{tt(lang, 'Project Settings', 'إعدادات المشروع')}</h2>
      <Field label={tt(lang, 'Project name', 'اسم المشروع')} value={form.name} onChange={set('name')} {...hintProps} />
      <Field label={tt(lang, 'Description', 'الوصف')} value={form.description} onChange={set('description')} textarea {...hintProps} />
      <div className="border-t border-slate-800 pt-4">
        <h3 className="text-sm font-semibold text-white mb-3">{tt(lang, 'SEO & Social', 'تحسين الظهور والمشاركة')}</h3>
        <div className="space-y-4">
          <Field label={tt(lang, 'SEO title', 'عنوان SEO')} value={form.seo_title} onChange={set('seo_title')}
            ph={tt(lang, 'Title shown in search & tabs', 'العنوان في البحث والتبويبات')}
            hintId="seo_title" {...hintProps}
            hintText={tt(lang,
              'This is the headline Google and browser tabs show for your site. Use a short, clear name with what you offer, e.g. “Elite Store — Smart Watches & Electronics”.',
              'هذا هو العنوان الذي يظهر لموقعك في نتائج جوجل وفي تبويبات المتصفح. اكتب اسماً قصيراً وواضحاً يوضّح ما تقدّمه، مثل: «متجر النخبة — ساعات ذكية وإلكترونيات».')} />
          <Field label={tt(lang, 'Search keywords', 'كلمات البحث المفتاحية')} value={form.seo_description} onChange={set('seo_description')} textarea
            hintId="seo_description" {...hintProps}
            hintText={tt(lang,
              'These are the words your customers type into Google to find a business like yours. Write a short sentence using those words, e.g. “online electronics store, smart watches, fast delivery, best prices”. The clearer it is, the easier people find you.',
              'هذه هي الكلمات التي يكتبها عملاؤك في جوجل ليجدوا متجراً مثل متجرك. اكتب جملة قصيرة تستخدم هذه الكلمات، مثل: «متجر إلكترونيات أونلاين، ساعات ذكية، توصيل سريع، أفضل الأسعار». كلما كانت أوضح، كان وصول الناس إليك أسهل.')} />

          {/* OG image: upload from computer (URL optional, hidden behind the field) */}
          <div className="block">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              {tt(lang, 'Share image', 'صورة المشاركة')}
              <Hint id="og_image_url" {...hintProps} text={tt(lang,
                'The picture that appears when your site is shared on WhatsApp, Facebook, or Twitter. Upload one from your computer — usually your logo or a product photo.',
                'الصورة التي تظهر عند مشاركة موقعك على واتساب أو فيسبوك أو تويتر. ارفعها من جهازك — عادةً شعارك أو صورة منتج.')} />
            </span>
            <div className="mt-1 flex items-center gap-3">
              {form.og_image_url
                ? <img src={form.og_image_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0" />
                : <div className="w-16 h-16 rounded-lg border border-dashed border-slate-700 grid place-items-center text-slate-600 shrink-0"><Upload size={16} /></div>}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5">
                  <Upload size={13} />
                  {uploading ? tt(lang, 'Uploading…', 'جارٍ الرفع…') : tt(lang, 'Upload image', 'رفع صورة')}
                  <input type="file" accept="image/*" onChange={uploadOgImage} disabled={uploading} className="hidden" />
                </label>
                {form.og_image_url && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, og_image_url: '' }))}
                    className="text-slate-500 hover:text-red-400 inline-flex items-center gap-1 text-xs">
                    <XIcon size={13} /> {tt(lang, 'Remove', 'إزالة')}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">{tt(lang, 'PNG or JPG, recommended 1200×630.', 'PNG أو JPG، يُفضّل 1200×630.')}</p>
          </div>
        </div>
      </div>

      {/* Public visibility — free for everyone. Controls whether the app shows in
          the public Explore gallery. */}
      <div className="border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
          {tt(lang, 'Visibility', 'الظهور للعامة')}
          <Hint id="is_public" {...hintProps} text={tt(lang,
            'When ON, your app appears in the public Capable gallery where anyone can discover it. When OFF, only you can see it via its link.',
            'عند التفعيل، يظهر تطبيقك في معرض كيبابل العام ليكتشفه أي زائر. عند الإيقاف، أنت فقط من يراه عبر رابطه.')} />
        </span>
        <label className="mt-2 flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-white">
            {form.is_public ? <Eye size={15} className="text-emerald-400" /> : <EyeOff size={15} className="text-slate-500" />}
            {form.is_public ? tt(lang, 'Public — shown in gallery', 'عام — يظهر في المعرض') : tt(lang, 'Private — only via link', 'خاص — عبر الرابط فقط')}
          </span>
          <span className="relative inline-block">
            <input type="checkbox" className="peer sr-only" checked={form.is_public}
              onChange={(e) => setForm(f => ({ ...f, is_public: e.target.checked }))} />
            <span className="block w-10 h-6 rounded-full bg-slate-600 peer-checked:bg-indigo-600 transition-colors" />
            <span className="absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4" />
          </span>
        </label>
      </div>

      {/* Sell / clone — premium. Creators can let others clone the app for a fee
          (or for free). Locked behind a paid plan. */}
      <div className="border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
          {tt(lang, 'Sell / clone', 'البيع والنسخ')}
          <PremiumBadge lang={lang} />
          <Hint id="price" {...hintProps} text={tt(lang,
            'Let other users clone your app into their own account. Set a price they pay per clone, or make it free. Selling and paid cloning are available on higher plans.',
            'اسمح للمستخدمين الآخرين بنسخ تطبيقك إلى حساباتهم. حدّد مبلغاً يدفعونه مقابل كل نسخة، أو اجعله مجانياً. البيع والنسخ المدفوع متاحان في الباقات الأعلى.')} />
        </span>
        <div className={`mt-2 ${canPremium ? '' : 'opacity-60 pointer-events-none select-none'}`}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-500" />
              <input type="number" min="0" step="1" value={form.price} disabled={!canPremium}
                onChange={(e) => setForm(f => ({ ...f, price: Math.max(0, parseInt(e.target.value || '0', 10)) }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl ps-9 pe-16 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              <span className="absolute top-1/2 -translate-y-1/2 end-3 text-xs text-slate-500">{tt(lang, 'SAR', 'ريال')}</span>
            </div>
            <button type="button" disabled={!canPremium}
              onClick={() => setForm(f => ({ ...f, price: 0 }))}
              className={`px-3 py-2 rounded-xl text-xs font-medium border ${form.price === 0 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
              {tt(lang, 'Free', 'مجاني')}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5">
            {form.price > 0
              ? tt(lang, `Others pay ${form.price} SAR to clone this app.`, `يدفع الآخرون ${form.price} ريال لنسخ هذا التطبيق.`)
              : tt(lang, 'Anyone can clone this app for free.', 'يمكن لأي شخص نسخ هذا التطبيق مجاناً.')}
          </p>
        </div>
      </div>

      {/* Custom domain — premium. */}
      <div className="border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
          {tt(lang, 'Custom domain', 'دومين مخصص')}
          <PremiumBadge lang={lang} />
        </span>
        <input value={form.custom_domain} onChange={set('custom_domain')} placeholder="example.com" disabled={!canPremium}
          className={`mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none ${canPremium ? '' : 'opacity-60 cursor-not-allowed'}`} />
        <p className="text-[11px] text-slate-600 mt-1">
          {canPremium
            ? tt(lang, 'Point your domain’s DNS to Capable, then verify from the editor.', 'وجّه DNS للدومين إلى Capable ثم فعّله من المحرّر.')
            : tt(lang, 'Connect your own domain (e.g. yourstore.com) on a higher plan.', 'اربط دومينك الخاص (مثل yourstore.com) عند الترقية لباقة أعلى.')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold">{t('save')}</button>
        {saved && <span className="text-sm text-emerald-400">✓ {tt(lang, 'Saved', 'تم الحفظ')}</span>}
      </div>
    </form>
  );
}
