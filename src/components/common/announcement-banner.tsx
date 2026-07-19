import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Sparkles, X, Check } from 'lucide-react';
import { useLatestUpdate } from '@/hooks/use-latest-update';
import { useLandingSettings } from '@/api/services/feedback-service';

export const AnnouncementBanner: React.FC = () => {
    const { data: latestUpdate } = useLatestUpdate();
    const { data: landingSettings } = useLandingSettings();
    const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        setDismissedVersion(localStorage.getItem('dismissed_update_version'));
    }, []);

    const maintenanceMode = landingSettings?.maintenance_mode ?? false;
    const hasNewUpdate = latestUpdate && latestUpdate.version !== dismissedVersion;

    if (!maintenanceMode && !hasNewUpdate) return null;

    const handleMarkAsRead = () => {
        if (latestUpdate) {
            localStorage.setItem('dismissed_update_version', latestUpdate.version);
            setDismissedVersion(latestUpdate.version);
        }
        setModalOpen(false);
    };

    // Render Maintenance Mode Warning
    if (maintenanceMode) {
        return (
            <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-4 py-2 text-center text-xs font-semibold text-amber-400 select-none relative z-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.06)] animate-in slide-in-from-top duration-300">
                <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                <span>System Upgrade In Progress: We are performing database optimizations. Core features remain active but some actions might experience temporary delays.</span>
            </div>
        );
    }

    // Render Normal Update Announcement
    if (!latestUpdate) return null;

    // Parse description into pointwise items
    const bulletPoints = latestUpdate.description
        ? latestUpdate.description.split('\n').map(p => p.replace(/^[-\*\s\•]+/, '').trim()).filter(Boolean)
        : [];

    return (
        <>
            <div className="bg-primary/10 border-b border-primary/20 backdrop-blur-md px-4 py-2.5 text-xs text-foreground select-none relative z-45 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_12px_rgba(var(--primary-rgb,99,102,241),0.05)] animate-in slide-in-from-top duration-300 w-full">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <Sparkles size={13} className="text-primary shrink-0 animate-pulse" />
                    <span className="font-bold tracking-tight">
                        Update {latestUpdate.version}: {latestUpdate.title}
                    </span>
                </div>
                
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                >
                    Read Release Notes
                </button>
            </div>

            {/* What's New Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="absolute inset-0 bg-[#06080E]/80 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Modal Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="relative w-full max-w-md bg-card/95 border border-border backdrop-blur-md rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-5 overflow-hidden select-none"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

                            {/* Header */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                                        <Sparkles size={11} />
                                        <span>What's New</span>
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">
                                        Version {latestUpdate.version}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Title & Date */}
                            <div className="space-y-1 pb-2 border-b border-border">
                                <h4 className="text-sm font-bold text-foreground leading-snug">
                                    {latestUpdate.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    Released {new Date(latestUpdate.release_date).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Point-wise Release Notes */}
                            <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1.5">
                                {bulletPoints.length > 0 ? (
                                    <ul className="space-y-2.5">
                                        {bulletPoints.map((point, index) => (
                                            <li key={index} className="flex gap-2.5 items-start text-xs leading-relaxed text-muted-foreground">
                                                <div className="p-1 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                                                    <Check size={10} />
                                                </div>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                                        {latestUpdate.description}
                                    </p>
                                )}
                            </div>

                            {/* Got it, Mark as Read Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleMarkAsRead}
                                    className="w-full py-3 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-1.5 hover:scale-[1.01] hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
                                >
                                    <Check size={13} strokeWidth={3} />
                                    <span>Got it, Mark as Read</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
