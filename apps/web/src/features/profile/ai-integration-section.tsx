import React, { useEffect, useState } from 'react';
import { Sparkles, Check, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAiSettings, useSaveAiSettings, type AiProvider } from '@llb/api';
import { cn } from '@/lib/utils';

const labelClass = "text-xs font-semibold text-muted-foreground ml-0.5";

const PROVIDERS: { value: AiProvider; label: string; keyHint: string; keyUrl: string }[] = [
    { value: 'anthropic', label: 'Claude (Anthropic)', keyHint: 'starts with sk-ant-', keyUrl: 'https://console.anthropic.com/settings/keys' },
    { value: 'openai', label: 'ChatGPT (OpenAI)', keyHint: 'starts with sk-', keyUrl: 'https://platform.openai.com/api-keys' },
    { value: 'gemini', label: 'Gemini (Google)', keyHint: 'starts with AIza', keyUrl: 'https://aistudio.google.com/apikey' },
];

/** Lets a user connect their own AI account (Claude/ChatGPT/Gemini) so
 *  features like "Plan my week with AI" run on their key, at their cost --
 *  never a shared key this app pays for. See ai-plan-week Edge Function. */
export const AiIntegrationSection: React.FC = () => {
    const { data: settings, isLoading } = useGetAiSettings();
    const saveSettings = useSaveAiSettings();

    const [provider, setProvider] = useState<AiProvider>('anthropic');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [autoWeeklyPlanning, setAutoWeeklyPlanning] = useState(false);

    useEffect(() => {
        if (settings?.provider) {
            setProvider(settings.provider);
            setModel(settings.model || '');
            setAutoWeeklyPlanning(settings.autoWeeklyPlanning);
        }
    }, [settings]);

    const isConnected = !!settings?.hasApiKey;
    const selectedProvider = PROVIDERS.find(p => p.value === provider)!;

    const handleSave = () => {
        // Blank means "keep the key already on file" -- required once
        // connected, since we never fetch the real key back to the form.
        if (!apiKey && !isConnected) return;
        saveSettings.mutate({
            provider,
            model: model || undefined,
            apiKey: apiKey || undefined,
            chatAssistantEnabled: false, // not built yet -- reserved for the chat assistant phase
            autoWeeklyPlanning,
        }, {
            onSuccess: () => setApiKey(''),
        });
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-bold">AI Assistant</h3>
                </div>
                {isConnected && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                        <Check size={12} strokeWidth={3} /> Connected
                    </span>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Connect your own Claude, ChatGPT, or Gemini account. Your key is encrypted and only ever
                used to plan on your behalf -- this app never sees or pays for your usage.
            </p>

            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <ShieldCheck size={14} strokeWidth={2.5} />
                    How your key is protected
                </div>
                <ul className="space-y-1 pl-0.5">
                    {[
                        'Encrypted before it’s stored — never saved as plain text, ever.',
                        'Write-only: once saved, it’s never sent back to any browser or device.',
                        'Locked to your account — no other user’s session can read or use it.',
                        'Only used for your own plans — this app never calls or pays for it.',
                    ].map((line) => (
                        <li key={line} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                            <Check size={12} strokeWidth={3} className="text-emerald-500 shrink-0 mt-0.5" />
                            {line}
                        </li>
                    ))}
                </ul>
            </div>

            {!isLoading && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>AI Provider</label>
                            <Select value={provider} onValueChange={(v) => setProvider(v as AiProvider)}>
                                <SelectTrigger className="h-10 rounded-xl bg-muted border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDERS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Model (optional)</label>
                            <Input
                                placeholder="Leave blank for the default"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="h-10 rounded-xl bg-muted border-border"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className={labelClass}>
                            <KeyRound className="inline h-3 w-3 mr-1 -mt-0.5" />
                            API Key {isConnected && <span className="opacity-60">(leave blank to keep the current one)</span>}
                        </label>
                        <Input
                            type="password"
                            placeholder={isConnected ? "••••••••••••" : selectedProvider.keyHint}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="h-10 rounded-xl bg-muted border-border font-mono"
                        />
                        <a href={selectedProvider.keyUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary/80 hover:text-primary underline underline-offset-2">
                            Get a {selectedProvider.label} key
                        </a>
                    </div>

                    <label className={cn(
                        "flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                        autoWeeklyPlanning ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                    )}>
                        <div>
                            <p className="text-sm font-semibold">Plan my week automatically</p>
                            <p className="text-[11px] text-muted-foreground">Runs at your usual weekly planning time -- coming soon, on by default once shipped.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoWeeklyPlanning}
                            onChange={(e) => setAutoWeeklyPlanning(e.target.checked)}
                            className="h-4 w-4 accent-primary shrink-0"
                        />
                    </label>

                    <Button
                        onClick={handleSave}
                        disabled={saveSettings.isPending || (!apiKey && !isConnected)}
                        className="w-full h-10 rounded-xl font-bold"
                    >
                        {saveSettings.isPending ? 'Saving...' : isConnected ? 'Update Connection' : 'Connect AI'}
                    </Button>
                </div>
            )}
        </div>
    );
};
