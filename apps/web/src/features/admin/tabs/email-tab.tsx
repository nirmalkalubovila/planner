import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Settings, FileText, Check, Save, Info, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalSmtpSettings, useGlobalEmailTemplates } from '@/api/services/admin-smtp-service';
import { CampaignsPanel } from '../components/campaigns-panel';


const DEFAULT_TEMPLATES_DATA: Record<string, { subject: string; body: string; enabled: boolean }> = {
    'daily-briefing': {
        subject: '☀️ Your Daily Briefing for {date}',
        body: `Good morning {name},

You have {task_count} tasks scheduled for today. Here is your briefing:

{tasks_list}

Let's build your legacy today!

Best,
{sender_name}`,
        enabled: true
    },
    'task-reminder': {
        subject: '📋 Reminder: {task_name} starts soon',
        body: `Hi {name},

This is a quick reminder that your task "{task_name}" starts at {start_time} and ends at {end_time}.

Best,
{sender_name}`,
        enabled: true
    },
    'goal-deadline': {
        subject: '🎯 Goal Deadline: {goal_name} is approaching',
        body: `Hi {name},

Your goal "{goal_name}" is approaching its deadline in {days_remaining} days.

You have completed {completed_milestones} of your {total_milestones} milestones ({progress}%).

Keep pushing forward!

Best,
{sender_name}`,
        enabled: true
    }
};

export const MailsTab: React.FC = () => {
    const [subTab, setSubTab] = useState<'campaigns' | 'smtp' | 'templates'>('campaigns');
    const { settings, isLoading: isSmtpLoading, saveSettings, isSaving: isSavingSmtp } = useGlobalSmtpSettings();
    const { templates, isLoading: isTemplatesLoading, saveTemplate, isSaving: isSavingTemplate } = useGlobalEmailTemplates();

    // SMTP form state
    const [smtpEnabled, setSmtpEnabled] = useState(false);
    const [senderEmail, setSenderEmail] = useState('');
    const [senderName, setSenderName] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState(587);
    const [minInterval, setMinInterval] = useState(60);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Template state
    const [selectedType, setSelectedType] = useState<string>('daily-briefing');
    const [templateSubject, setTemplateSubject] = useState('');
    const [templateBody, setTemplateBody] = useState('');
    const [templateEnabled, setTemplateEnabled] = useState(true);

    React.useEffect(() => {
        if (settings) {
            setSmtpEnabled(settings.enabled);
            setSenderEmail(settings.senderEmail || '');
            setSenderName(settings.senderName || '');
            setHost(settings.host || '');
            setPort(settings.port || 587);
            setMinInterval(settings.minInterval || 60);
            setUsername(settings.username || '');
            setPassword(settings.hasPassword ? '••••••••' : '');
        }
    }, [settings]);

    React.useEffect(() => {
        const current = templates.find(t => t.type === selectedType);
        if (current) {
            setTemplateSubject(current.subject);
            setTemplateBody(current.body);
            setTemplateEnabled(current.enabled);
        } else {
            const defaults = DEFAULT_TEMPLATES_DATA[selectedType];
            if (defaults) {
                setTemplateSubject(defaults.subject);
                setTemplateBody(defaults.body);
                setTemplateEnabled(defaults.enabled);
            } else {
                setTemplateSubject('');
                setTemplateBody('');
                setTemplateEnabled(true);
            }
        }
    }, [templates, selectedType]);

    const handleSaveSmtp = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveSettings({
            settings: {
                enabled: smtpEnabled,
                senderEmail,
                senderName,
                host,
                port,
                minInterval,
                username,
            },
            password: password === '••••••••' ? undefined : password,
        });
    };

    const handleSaveTemplate = async () => {
        await saveTemplate({
            type: selectedType,
            enabled: templateEnabled,
            subject: templateSubject,
            body: templateBody,
        });
    };

    const placeholders: Record<string, string[]> = {
        'daily-briefing': ['{name}', '{date}', '{task_count}', '{tasks_list}', '{sender_name}'],
        'task-reminder': ['{name}', '{task_name}', '{start_time}', '{end_time}', '{sender_name}'],
        'goal-deadline': ['{name}', '{goal_name}', '{days_remaining}', '{completed_milestones}', '{total_milestones}', '{progress}', '{sender_name}'],
    };

    if (isSmtpLoading || isTemplatesLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
                <button
                    onClick={() => setSubTab('campaigns')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                        subTab === 'campaigns'
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <Mail className="h-3.5 w-3.5" />
                    Campaigns
                </button>
                <button
                    onClick={() => setSubTab('smtp')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        subTab === 'smtp'
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <Settings className="h-3.5 w-3.5" />
                    SMTP Settings
                </button>
                <button
                    onClick={() => setSubTab('templates')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        subTab === 'templates'
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <FileText className="h-3.5 w-3.5" />
                    Email Templates
                </button>
            </div>

            {subTab === 'campaigns' && <CampaignsPanel onOpenSmtp={() => setSubTab('smtp')} />}

            {subTab === 'smtp' && (
                <form onSubmit={handleSaveSmtp} className="space-y-6 max-w-2xl">
                    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold">Enable Custom SMTP</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Send all email notifications through your Brevo/custom provider.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSmtpEnabled(!smtpEnabled)}
                                className={`relative w-10 h-6 rounded-full transition-colors ${
                                    smtpEnabled ? 'bg-emerald-500' : 'bg-muted'
                                }`}
                            >
                                <span className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                                    smtpEnabled ? 'translate-x-[18px]' : ''
                                }`} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                Sender Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Sender Email Address</label>
                                    <Input
                                        value={senderEmail}
                                        onChange={e => setSenderEmail(e.target.value)}
                                        placeholder="nirmalpriyankara.web@gmail.com"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Sender Name</label>
                                    <Input
                                        value={senderName}
                                        onChange={e => setSenderName(e.target.value)}
                                        placeholder="Legacy Life Builder Team"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5" />
                                SMTP Credentials
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Host</label>
                                    <Input
                                        value={host}
                                        onChange={e => setHost(e.target.value)}
                                        placeholder="smtp-relay.brevo.com"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Port Number</label>
                                        <Input
                                            type="number"
                                            value={port}
                                            onChange={e => setPort(Number(e.target.value))}
                                            placeholder="587"
                                            className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                            required={smtpEnabled}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Interval (s)</label>
                                        <Input
                                            type="number"
                                            value={minInterval}
                                            onChange={e => setMinInterval(Number(e.target.value))}
                                            placeholder="60"
                                            className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                            required={smtpEnabled}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Username</label>
                                    <Input
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="a3beaa001@smtp-brevo.com"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="SMTP Password"
                                            className="mt-1 h-9 pr-9 bg-muted/50 border-border rounded-xl text-xs"
                                            required={smtpEnabled && !settings?.hasPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingSmtp} className="rounded-xl px-5 h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
                            {isSavingSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save SMTP Settings
                        </Button>
                    </div>
                </form>
            )}

            {subTab === 'templates' && (
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                    {/* Template list */}
                    <div className="space-y-2">
                        {['daily-briefing', 'task-reminder', 'goal-deadline'].map((type) => {
                            const t = templates.find(temp => temp.type === type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`w-full text-left px-4 py-3 border rounded-xl transition-all ${
                                        selectedType === type
                                            ? 'bg-primary/10 border-primary/30 text-foreground'
                                            : 'bg-card/40 border-border text-muted-foreground hover:text-foreground hover:bg-card'
                                    }`}
                                >
                                    <div className="text-xs font-bold capitalize">{type.replace('-', ' ')}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {t?.enabled ? 'Active' : 'Disabled'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Editor */}
                    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold capitalize">{selectedType.replace('-', ' ')} Template</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Customize the email content.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTemplateEnabled(!templateEnabled)}
                                className={`relative w-10 h-6 rounded-full transition-colors ${
                                    templateEnabled ? 'bg-emerald-500' : 'bg-muted'
                                }`}
                            >
                                <span className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                                    templateEnabled ? 'translate-x-[18px]' : ''
                                }`} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Subject</label>
                                <Input
                                    value={templateSubject}
                                    onChange={e => setTemplateSubject(e.target.value)}
                                    placeholder="Enter subject line..."
                                    className="mt-1 h-10 bg-muted/50 border-border rounded-xl text-xs font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Body</label>
                                <textarea
                                    value={templateBody}
                                    onChange={e => setTemplateBody(e.target.value)}
                                    rows={10}
                                    className="w-full mt-1 p-3 bg-muted/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed font-mono"
                                    placeholder="Enter template body..."
                                />
                            </div>
                        </div>

                        {/* Available Placeholders Tip */}
                        <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-3.5 space-y-1.5">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Available Variables
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {placeholders[selectedType]?.map((p) => (
                                    <code key={p} className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-foreground font-mono">
                                        {p}
                                    </code>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSaveTemplate} disabled={isSavingTemplate} className="rounded-xl px-5 h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
                                {isSavingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Template
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

