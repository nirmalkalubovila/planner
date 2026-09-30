import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackForm } from '@/components/common/feedback-form';

export const FeedbackSection: React.FC = () => (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <MessageSquarePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
                <h3 className="text-base font-bold">Rate Legacy Life Builder</h3>
                <p className="text-[11px] text-muted-foreground">Two taps and a sentence. It takes under a minute.</p>
            </div>
        </div>
        <FeedbackForm />
    </div>
);
