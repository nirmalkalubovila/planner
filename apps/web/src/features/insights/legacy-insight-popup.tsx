import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { StandardDialog } from '@/components/common/standard-dialog';
import {
    LEGACY_INSIGHTS, closeInsight, isInsightDue, legacyLink, readInsightState,
} from './legacy-insights';

const SHOW_DELAY_MS = 8000;
// Only inside the working app, never on the public or admin pages
const APP_PATHS = ['/today', '/habits', '/goals', '/planner', '/reset', '/statistics'];

interface LegacyInsightPopupProps {
    /** True while something more important (a milestone celebration) is on screen. */
    suppress?: boolean;
    /** Users already executing every day do not need it. */
    consistent: boolean;
    /** Wait until the data that decides "consistent" has loaded. */
    ready: boolean;
}

/**
 * A short piece of knowledge from The Legacy Life, shown to people who are not executing every day.
 * Every insight links to the exact section of the page that teaches it. Closing brings the next one back
 * in a week; "Don't show this again" ends it.
 */
export const LegacyInsightPopup: React.FC<LegacyInsightPopupProps> = ({ suppress, consistent, ready }) => {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [seen, setSeen] = useState(0);

    const userId = user?.id;
    const accountAgeDays = user?.created_at ? (Date.now() - new Date(user.created_at).getTime()) / 86400000 : 0;
    const eligible = !!userId && ready && !consistent && !suppress && accountAgeDays >= 2 && APP_PATHS.some((p) => pathname.startsWith(p));

    useEffect(() => {
        if (!eligible || !userId || open) return;
        const state = readInsightState(userId);
        if (!isInsightDue(state)) return;
        const timer = window.setTimeout(() => {
            setSeen(state.seen);
            setOpen(true);
        }, SHOW_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [eligible, userId, open]);

    if (!userId) return null;

    const index = seen % LEGACY_INSIGHTS.length;

    // Closing, reading more and "don't show again" all move on to a new insight next time, or stop for good
    const finish = (dontShowAgain: boolean) => {
        closeInsight(userId, readInsightState(userId), dontShowAgain);
        setOpen(false);
    };

    return <InsightDialog open={open} index={index} onFinish={finish} />;
};

/** The dialog itself: pure, so it can be reviewed on its own. `onFinish(true)` means "don't show this again". */
export const InsightDialog: React.FC<{ open: boolean; index: number; onFinish: (dontShowAgain: boolean) => void }> = ({ open, index, onFinish }) => {
    const insight = LEGACY_INSIGHTS[index % LEGACY_INSIGHTS.length];
    return (
        <StandardDialog
            isOpen={open}
            onClose={() => onFinish(false)}
            title={insight.title}
            subtitle={`Legacy Insight · ${String(index + 1).padStart(2, '0')} of ${LEGACY_INSIGHTS.length}`}
            maxWidth="md"
            footer={
                <div className="flex w-full flex-col gap-3">
                    <Button asChild size="lg" className="w-full">
                        <a
                            href={legacyLink('insight_popup', insight.anchor, insight.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onFinish(false)}
                        >
                            Learn about this
                        </a>
                    </Button>
                    <button
                        type="button"
                        onClick={() => onFinish(true)}
                        className="self-center text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                    >
                        Don&apos;t show this again
                    </button>
                </div>
            }
        >
            <div className="space-y-4 px-5 py-4 sm:px-6">
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                        key={insight.image}
                        src={insight.image}
                        alt=""
                        loading="lazy"
                        className="h-36 w-full object-cover sm:h-44"
                    />
                </div>

                <p className="text-sm leading-relaxed text-foreground">{insight.body}</p>

                <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Try this week</p>
                    <p className="text-sm leading-snug text-foreground">{insight.action}</p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                    Not an ad. Just an idea for working with direction, from The Legacy Life.
                </p>
            </div>
        </StandardDialog>
    );
};
