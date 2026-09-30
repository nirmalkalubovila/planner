import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, ArrowLeft, Eye, Mail, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminGuard } from './admin-guard';
import { DashboardTab } from './tabs/dashboard-tab';
import { FeedbacksTab } from './tabs/feedbacks-tab';
import { UsersTab } from './tabs/users-tab';
import { MailsTab } from './tabs/email-tab';
import { LandingTab } from './tabs/landing-tab';
import { UpdatesTab } from './tabs/updates-tab';
import { ProductIntelligenceTab } from './components/insights-section';

type Tab = 'dashboard' | 'feedbacks' | 'users' | 'landing' | 'updates' | 'email';

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'feedbacks', label: 'Feedbacks', icon: <MessageSquare className="h-4 w-4" /> },
    { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { key: 'landing', label: 'Landing Page', icon: <Settings className="h-4 w-4" /> },
    { key: 'updates', label: 'App Updates', icon: <Sparkles className="h-4 w-4" /> },
    { key: 'email', label: 'Email Marketing', icon: <Mail className="h-4 w-4" /> },
];

// ── Admin Page Shell ─────────────────────────────────────────────────
const AdminPageInner: React.FC = () => {
    const [tab, setTab] = useState<Tab>('dashboard');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/today')} className="h-8 w-8 rounded-lg">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center">
                                <Eye className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-black tracking-wide">Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab nav */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4">
                <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
                    {TAB_ITEMS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                                tab === t.key
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t.icon}
                            <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                {tab === 'dashboard' && (
                    <div className="space-y-10">
                        <DashboardTab />
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-base font-black tracking-tight">Insights: needs & sentiment</h2>
                                <p className="text-xs text-muted-foreground">What users love, where they struggle and what they ask for.</p>
                            </div>
                            <ProductIntelligenceTab />
                        </section>
                    </div>
                )}
                {tab === 'feedbacks' && <FeedbacksTab />}
                {tab === 'users' && <UsersTab />}
                {tab === 'landing' && <LandingTab />}
                {tab === 'updates' && <UpdatesTab />}
                {tab === 'email' && <MailsTab />}
            </div>
        </div>
    );
};

export const AdminPage: React.FC = () => (
    <AdminGuard>
        <AdminPageInner />
    </AdminGuard>
);

