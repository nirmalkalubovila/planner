import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useUserStats } from '../hooks/use-user-stats';
import { useDetailedAnalytics } from '../hooks/use-detailed-stats';
import { FeedbackLoader } from '@/components/ui/feedback-loader';
import { SummaryView } from './summary-view';
import { DetailedView } from './detailed-view';

type Tab = 'summary' | 'detailed';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'detailed', label: 'Detailed' },
];

const OracleHeader: React.FC<{
  userName: string;
  burnoutWarning: string | null;
}> = ({ burnoutWarning }) => (
  <header className="flex flex-col space-y-1">
    
    {burnoutWarning && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-sm text-rose-400 font-medium"
      >
        {burnoutWarning}
      </motion.p>
    )}
  </header>
);

const TabSwitcher: React.FC<{ active: Tab; onChange: (t: Tab) => void }> = ({ active, onChange }) => (
  <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 w-fit">
    {TABS.map(tab => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={cn(
          'relative px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors duration-200',
          active === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70',
        )}
      >
        {active === tab.id && (
          <motion.span
            layoutId="active-tab-pill"
            className="absolute inset-0 rounded-full bg-white/10 border border-white/10"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">{tab.label}</span>
      </button>
    ))}
  </div>
);

export const PerformanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Voyager';

  const { data: cache, isLoading: cacheLoading } = useUserStats();

  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [detailedEnabled, setDetailedEnabled] = useState(false);

  useEffect(() => {
    if (!detailedEnabled) setDetailedEnabled(true);
  }, []);

  const { data: detailed, isLoading: detailedLoading } = useDetailedAnalytics(detailedEnabled);

  if (cacheLoading || !cache) {
    return (
      <div className="flex flex-col w-full h-full items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-white/40 text-sm">Loading insights…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-8 space-y-6 pb-20 animate-in fade-in duration-500">
      <OracleHeader userName={userName} burnoutWarning={cache.predictive_burnout_warning} />

      <TabSwitcher active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <FeedbackLoader isLoading={detailedLoading} message="Calculating analytics…">
              <SummaryView cache={cache} detailed={detailed} />
            </FeedbackLoader>
          </motion.div>
        )}

        {activeTab === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <FeedbackLoader isLoading={detailedLoading || !detailed} message="Calculating analytics…">
              {detailed ? <DetailedView data={detailed} /> : <div className="min-h-[300px]" />}
            </FeedbackLoader>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
