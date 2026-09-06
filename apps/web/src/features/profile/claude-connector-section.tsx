import React, { useState } from 'react';
import { Plug, Copy, Check, ShieldCheck, TriangleAlert, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMcpConnectorStatus, useCreateMcpConnectorToken, useRevokeMcpConnectorToken } from '@llb/api';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { cn } from '@/lib/utils';

const labelClass = "text-xs font-semibold text-muted-foreground ml-0.5";

const formatWhen = (iso: string | null) => {
    if (!iso) return 'never';
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * Generates the per-user connector link that plugs this planner into Claude
 * (or any MCP-capable AI app), so a normal chat there can read and change
 * the user's real goals, habits and weekly grid — using their existing
 * subscription, with no API key and no per-token billing.
 */
export const ClaudeConnectorSection: React.FC = () => {
    const { data: status, isLoading } = useMcpConnectorStatus();
    const createToken = useCreateMcpConnectorToken();
    const revokeToken = useRevokeMcpConnectorToken();

    // Held in memory only, and only right after minting — the raw secret is
    // never stored anywhere we could read it back from.
    const [freshToken, setFreshToken] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

    const isConnected = !!status?.hasToken;

    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp`;
    // Authorization rather than a custom name: Claude requires custom header
    // names to be approved by Anthropic first, while Authorization is standard
    // and offered in its dropdown. Verified to survive Supabase's gateway
    // (the function is deployed with --no-verify-jwt, so nothing intercepts it).
    const HEADER_NAME = 'Authorization';

    const handleGenerate = () => {
        createToken.mutate(undefined, {
            onSuccess: (rawToken) => {
                setFreshToken(rawToken);
                setCopied(null);
            },
        });
    };

    const handleCopy = async (field: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(field);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Clipboard can be blocked; every field is selectable as a fallback.
        }
    };

    const CopyField: React.FC<{ id: string; label: string; value: string; mono?: boolean }> = ({ id, label, value }) => (
        <div className="space-y-1.5">
            <label className={labelClass}>{label}</label>
            <div className="flex gap-2">
                <Input
                    readOnly
                    value={value}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-10 rounded-xl bg-muted border-border font-mono text-xs"
                />
                <Button onClick={() => handleCopy(id, value)} className="h-10 rounded-xl font-bold shrink-0 px-4">
                    {copied === id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-bold">Connect to Claude</h3>
                </div>
                {isConnected && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                        <Check size={12} strokeWidth={3} /> Link Active
                    </span>
                )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
                Add this planner to Claude as a connector, then just chat normally — "plan my week",
                "I'm behind on my savings goal, shift the milestones" — and Claude reads and updates
                your real goals, habits and calendar. Runs on your existing Claude subscription:
                no API key, nothing extra to pay for.
            </p>

            {!isLoading && !freshToken && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {isConnected ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-border bg-muted/20">
                                    <p className={labelClass}>Created</p>
                                    <p className="text-sm font-semibold mt-0.5">{formatWhen(status?.createdAt ?? null)}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-border bg-muted/20">
                                    <p className={labelClass}>Last used by an AI app</p>
                                    <p className="text-sm font-semibold mt-0.5">{formatWhen(status?.lastUsedAt ?? null)}</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Your link is active but can't be shown again — it was only ever visible once, when it was created.
                                If you've lost it, generate a new one (which replaces the old one everywhere).
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRegenerateConfirm(true)}
                                    disabled={createToken.isPending}
                                    className="h-10 rounded-xl font-bold flex-1"
                                >
                                    <RefreshCw size={14} className="mr-2" />
                                    {createToken.isPending ? 'Generating...' : 'Generate New Link'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowRevokeConfirm(true)}
                                    disabled={revokeToken.isPending}
                                    className="h-10 rounded-xl font-bold text-destructive hover:bg-destructive/10 flex-1"
                                >
                                    <Trash2 size={14} className="mr-2" /> Revoke Access
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={createToken.isPending}
                            className="w-full h-10 rounded-xl font-bold"
                        >
                            {createToken.isPending ? 'Generating...' : 'Generate Connector Link'}
                        </Button>
                    )}
                </div>
            )}

            {freshToken && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                            <TriangleAlert size={14} strokeWidth={2.5} />
                            Copy this now — it won't be shown again
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            Only a hash is stored on the server, so nobody — including us — can recover this later.
                            Treat it like a password: anyone holding it can read and change your planner.
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 space-y-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            <ShieldCheck size={14} strokeWidth={2.5} /> Recommended — keeps the secret out of the URL
                        </div>
                        <CopyField id="url" label="Server URL" value={baseUrl} />
                        <CopyField id="hname" label="Header name" value={HEADER_NAME} />
                        <CopyField id="hvalue" label="Header value" value={`Bearer ${freshToken}`} />
                        <ol className="space-y-1.5 text-[11px] text-muted-foreground leading-snug list-none pt-1">
                            {[
                                'In Claude: Settings → Connectors → "Add custom connector".',
                                'Name it (e.g. "Legacy Life Builder") and paste the Server URL. Continue.',
                                'On step 2, leave Authentication set to "None".',
                                'Under "Request headers", pick "Authorization" from the dropdown — do not type a custom name, those need Anthropic approval.',
                                'Paste the header value above (including the word Bearer), tick Required, then click Add.',
                            ].map((step, i) => (
                                <li key={step} className="flex items-start gap-2">
                                    <span className="font-mono text-[10px] font-bold text-emerald-500 shrink-0 mt-px">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <details className="group">
                        <summary className="cursor-pointer text-[11px] font-bold text-muted-foreground hover:text-foreground select-none">
                            Or use a single link instead (simpler, but the secret sits in the URL)
                        </summary>
                        <div className="pt-3">
                            <CopyField id="fullurl" label="All-in-one URL — paste as the Server URL, add no headers" value={`${baseUrl}/${freshToken}`} />
                        </div>
                    </details>

                    <Button variant="ghost" onClick={() => setFreshToken(null)} className="w-full h-9 rounded-xl text-xs font-bold">
                        Done — hide these
                    </Button>
                </div>
            )}

            <div className={cn("p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5")}>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <ShieldCheck size={14} strokeWidth={2.5} />
                    How this link is secured
                </div>
                <ul className="space-y-1 pl-0.5">
                    {[
                        'Only a one-way hash is stored — the link itself can never be read back out of the database.',
                        'It unlocks your account and nothing else; no other user’s data is reachable through it.',
                        'Revoke it here at any time and it stops working instantly, everywhere it’s been pasted.',
                        '“Last used” above lets you spot any access you didn’t make.',
                    ].map((line) => (
                        <li key={line} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                            <Check size={12} strokeWidth={3} className="text-emerald-500 shrink-0 mt-0.5" />
                            {line}
                        </li>
                    ))}
                </ul>
            </div>

            <ConfirmationDialog
                isOpen={showRevokeConfirm}
                onClose={() => setShowRevokeConfirm(false)}
                onConfirm={() => {
                    revokeToken.mutate();
                    setFreshToken(null);
                    setShowRevokeConfirm(false);
                }}
                title="Revoke connector access?"
                description="Any AI app using this link loses access to your planner immediately. Your goals, habits and plans are not affected — only the connection is removed. You can generate a new link at any time."
                confirmText="Revoke Access"
                cancelText="Keep It"
                variant="destructive"
            />

            <ConfirmationDialog
                isOpen={showRegenerateConfirm}
                onClose={() => setShowRegenerateConfirm(false)}
                onConfirm={() => {
                    setShowRegenerateConfirm(false);
                    handleGenerate();
                }}
                title="Generate a new link?"
                description="This replaces your current link. Anywhere you've already pasted the old one will stop working until you paste the new one in its place."
                confirmText="Generate New Link"
                cancelText="Cancel"
            />
        </div>
    );
};
