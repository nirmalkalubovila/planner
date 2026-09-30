import React, { useState } from 'react';
import { Send, Loader2, MailCheck, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@llb/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { useGlobalSmtpSettings } from '@/api/services/admin-smtp-service';
import {
    AUDIENCE_OPTIONS, runCampaign, sendTestEmail, useAudienceCount, useEmailCampaigns,
    type Audience, type CampaignProgress,
} from '@/api/services/admin-marketing-service';

const labelClass = 'text-[10px] font-bold text-muted-foreground uppercase tracking-wider';

const STARTERS: { label: string; subject: string; body: string }[] = [
    {
        label: 'New feature',
        subject: 'New in Legacy Life Builder',
        body: 'Hi {name},\n\nWe just shipped something new: [describe the feature in one or two sentences].\n\nHere is how it helps you: [benefit].\n\nOpen the app to try it: https://legacylifebuilder.com\n\nKeep building,\nThe Legacy Life Builder team',
    },
    {
        label: 'System update',
        subject: 'Scheduled update to Legacy Life Builder',
        body: 'Hi {name},\n\nWe will be upgrading the system on [date] at [time]. The app may be unavailable for a short while. Your data stays safe.\n\nThanks for your patience,\nThe Legacy Life Builder team',
    },
    {
        label: 'Come back',
        subject: 'Your plan is waiting, {name}',
        body: 'Hi {name},\n\nIt has been a while. Your goals are still there and picking up again takes two minutes: open your planner and complete one small task today.\n\nhttps://legacylifebuilder.com\n\nThe Legacy Life Builder team',
    },
];

export const CampaignsPanel: React.FC<{ onOpenSmtp: () => void }> = ({ onOpenSmtp }) => {
    const queryClient = useQueryClient();
    const { settings } = useGlobalSmtpSettings();
    const { data: campaigns } = useEmailCampaigns();

    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState<Audience>('all');
    const { data: audienceCount, isLoading: countLoading } = useAudienceCount(audience);

    const [confirming, setConfirming] = useState(false);
    const [testing, setTesting] = useState(false);
    const [progress, setProgress] = useState<CampaignProgress | null>(null);
    const [sending, setSending] = useState(false);

    const smtpReady = !!settings?.enabled;
    const valid = subject.trim().length > 0 && body.trim().length > 0;

    const handleTest = async () => {
        setTesting(true);
        try {
            const r = await sendTestEmail(subject.trim(), body.trim());
            toast.success(`Test email sent to ${r.sentTo}`);
        } catch (e) {
            toast.error('Test failed: ' + (e as Error).message);
        } finally {
            setTesting(false);
        }
    };

    const handleSend = async () => {
        setConfirming(false);
        setSending(true);
        setProgress(null);
        try {
            const final = await runCampaign(subject.trim(), body.trim(), audience, setProgress);
            toast.success(`Campaign finished: ${final.sent} sent, ${final.failed} failed`);
            setSubject('');
            setBody('');
        } catch (e) {
            toast.error('Campaign stopped: ' + (e as Error).message);
        } finally {
            setSending(false);
            queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
        }
    };

    const pct = progress && progress.total ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0;

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
                {!smtpReady && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                            SMTP is not enabled, so nothing can be sent yet.{' '}
                            <button type="button" onClick={onOpenSmtp} className="underline font-semibold">Open SMTP settings</button>
                        </span>
                    </div>
                )}

                <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Compose</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Only users who opted in to marketing emails receive it. Every email includes an unsubscribe link.</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {STARTERS.map((s) => (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => { setSubject(s.subject); setBody(s.body); }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <label className={labelClass}>Subject</label>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="Subject line" className="h-10 rounded-xl bg-muted border-border" />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Message <span className="normal-case font-medium">(use {'{name}'} for the first name)</span></label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={10}
                            maxLength={5000}
                            placeholder="Write your message..."
                            className="flex w-full rounded-xl border border-input bg-muted px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Audience</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AUDIENCE_OPTIONS.map((a) => (
                                <button
                                    key={a.value}
                                    type="button"
                                    onClick={() => setAudience(a.value)}
                                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${audience === a.value ? 'bg-accent border-foreground/30 text-foreground shadow-sm' : 'bg-card/60 border-border text-muted-foreground hover:bg-accent/40'}`}
                                >
                                    <span className="block font-bold">{a.label}</span>
                                    <span className="block text-[10px] opacity-80">{a.hint}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {countLoading ? 'Counting recipients...' : <><strong className="text-foreground">{audienceCount ?? 0}</strong> recipient{audienceCount === 1 ? '' : 's'} in this audience</>}
                        </p>
                    </div>

                    {sending && progress && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                                <span>Sending... {progress.sent + progress.failed} of {progress.total}</span>
                                <span>{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                            <p className="text-[10px] text-muted-foreground">Keep this page open until it finishes.</p>
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border">
                        <Button variant="outline" onClick={handleTest} disabled={!valid || !smtpReady || testing || sending} className="h-10 rounded-xl gap-2">
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                            Send test to me
                        </Button>
                        <Button onClick={() => setConfirming(true)} disabled={!valid || !smtpReady || !audienceCount || sending} className="h-10 rounded-xl gap-2">
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send campaign
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-3 h-fit">
                <h3 className="text-sm font-bold uppercase tracking-wider">History</h3>
                {(campaigns ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No campaigns sent yet.</p>
                ) : (
                    <div className="space-y-2">
                        {(campaigns ?? []).map((c) => (
                            <div key={c.id} className="bg-muted/20 border border-border/40 rounded-xl p-3 space-y-1">
                                <p className="text-xs font-bold truncate">{c.subject}</p>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="capitalize">{c.status}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    <span className="text-emerald-400 font-bold">{c.sent} sent</span>
                                    {c.failed > 0 && <span className="text-red-400 font-bold"> | {c.failed} failed</span>}
                                    {` of ${c.total}`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={handleSend}
                title={`Send to ${audienceCount ?? 0} people?`}
                description={`"${subject.trim()}" will be emailed to ${audienceCount ?? 0} opted-in user${audienceCount === 1 ? '' : 's'}. This cannot be undone. Send a test to yourself first if you have not.`}
                confirmText="Send campaign"
            />
        </div>
    );
};
