import React, { useState, useEffect } from 'react';
import { Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@llb/core';
import { AppUpdateService, type AppUpdate } from '@llb/api';
import { MaintenanceCard } from '../components/maintenance-card';


export const UpdatesTab: React.FC = () => {
    const [updates, setUpdates] = useState<AppUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [version, setVersion] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const data = await AppUpdateService.getAllUpdates();
            setUpdates(data);
        } catch (e) {
            console.error("Failed to load updates:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!version.trim() || !title.trim() || !description.trim()) {
            toast.error("Please fill all update fields.");
            return;
        }

        setSaving(true);
        try {
            await AppUpdateService.createUpdate(version.trim(), title.trim(), description.trim());
            toast.success("Release update published successfully!");
            setVersion('');
            setTitle('');
            setDescription('');
            fetchUpdates();
        } catch (err: any) {
            toast.error("Failed to publish update: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this release update?")) return;
        try {
            await AppUpdateService.deleteUpdate(id);
            toast.success("Release update deleted");
            fetchUpdates();
        } catch (err: any) {
            toast.error("Failed to delete update: " + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <MaintenanceCard />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Publish Update Form */}
                <div className="lg:col-span-1 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Publish New Update</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Announce a new release to all active users instantly.</p>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Version Number</label>
                            <Input
                                value={version}
                                onChange={e => setVersion(e.target.value)}
                                placeholder="e.g. v1.2.0"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Release Title</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Satisfying Goal Completion & System Wins"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Release Notes / Description (Pointwise)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Separate bullet points with newlines:&#10;- Added golden particles&#10;- Added system wins Insights"
                                rows={6}
                                className="w-full bg-zinc-900 border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none font-sans"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            <span>{saving ? 'Publishing...' : 'Publish Update'}</span>
                        </Button>
                    </form>
                </div>

                {/* Published Updates List */}
                <div className="lg:col-span-2 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Published Updates & Changelogs</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage existing updates sent to users.</p>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : updates.length > 0 ? (
                        <div className="space-y-4">
                            {updates.map((up) => (
                                <div key={up.id} className="p-4 rounded-xl border border-border bg-glass relative group flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                                                {up.version}
                                            </span>
                                            <h4 className="text-sm font-black text-foreground truncate">{up.title}</h4>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Released: {new Date(up.release_date).toLocaleString()}
                                        </p>
                                        <div className="space-y-1 pl-1">
                                            {up.description.split('\n').filter(Boolean).map((line, idx) => (
                                                <div key={idx} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                                                    <span className="text-primary mt-1 select-none font-bold text-[9px]">•</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleDelete(up.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-xs text-muted-foreground">
                            No release updates published yet. Publish one on the left panel!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

