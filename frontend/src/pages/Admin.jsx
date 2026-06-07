import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, FolderOpen, MessageSquare, DollarSign, Shield, ArrowLeft, Trophy, Boxes } from 'lucide-react';
import { useLang } from '../i18n/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LangToggle from '../components/LangToggle.jsx';
import OverviewTab from '../admin/OverviewTab.jsx';
import UsersTab from '../admin/UsersTab.jsx';
import ContentTab from '../admin/ContentTab.jsx';
import CrmTab from '../admin/CrmTab.jsx';
import FinanceTab from '../admin/FinanceTab.jsx';
import ChallengesTab from '../admin/ChallengesTab.jsx';
import EcosystemTab from '../admin/EcosystemTab.jsx';

export default function Admin() {
  const { t, lang, isRTL } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('adminOverview'), icon: LayoutDashboard, Comp: OverviewTab },
    { id: 'users', label: t('adminUsers'), icon: Users, Comp: UsersTab },
    { id: 'content', label: t('adminContent'), icon: FolderOpen, Comp: ContentTab },
    { id: 'crm', label: t('adminCrm'), icon: MessageSquare, Comp: CrmTab },
    { id: 'finance', label: t('adminFinance'), icon: DollarSign, Comp: FinanceTab },
    { id: 'challenges', label: lang === 'ar' ? 'التحديات' : 'Challenges', icon: Trophy, Comp: ChallengesTab },
    { id: 'ecosystem', label: lang === 'ar' ? 'النظام البيئي' : 'Ecosystem', icon: Boxes, Comp: EcosystemTab },
  ];
  const Active = tabs.find(x => x.id === tab).Comp;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500/90 p-1.5 rounded-lg text-slate-900"><Shield size={18} /></div>
          <span className="font-bold text-lg text-white">{t('adminPanel')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs text-slate-500 hidden sm:inline">{user?.email}</span>
          <LangToggle />
          <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} /> {t('adminBackToDashboard')}
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Active tab */}
        <section>
          <Active lang={lang} />
        </section>
      </main>
    </div>
  );
}
