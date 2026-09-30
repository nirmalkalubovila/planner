import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAdminUpdateFeedbackStatus } from '@/api/services/feedback-service';
import { STATUS_COLORS, FEEDBACK_STATUSES, type FeedbackStatus } from '../admin-constants';


export const StatusDropdown: React.FC<{ feedbackId: string; currentStatus: FeedbackStatus }> = ({ feedbackId, currentStatus }) => {
    const [open, setOpen] = useState(false);
    const updateStatus = useAdminUpdateFeedbackStatus();

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${STATUS_COLORS[currentStatus]}`}
            >
                {currentStatus}
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-2xl p-1 min-w-[120px]">
                        {FEEDBACK_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    updateStatus.mutate({ id: feedbackId, status: s });
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    s === currentStatus ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

