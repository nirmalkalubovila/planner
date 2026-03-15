import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUserStats } from '../hooks/use-user-stats';
import { useDetailedAnalytics } from '../hooks/use-detailed-stats';
import { PageLoader } from '@/components/common/page-loader';
import { SummaryView } from './summary-view';
import { DetailedView } from './detailed-view';

type Tab = 'summary' | 'detailed';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'detailed', label: 'Detailed' },
];

const TabSwitcher: React.FC<{ active: Tab; onChange: (t: Tab) => void }> = ({ active, onChange }) => (
  <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 w-fit">
    {TABS.map(tab => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={cn(
          'relative px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors duration-150',
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
  const { data: cache, isLoading: cacheLoading } = useUserStats();

  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [detailedEnabled, setDetailedEnabled] = useState(false);

  useEffect(() => {
    if (!detailedEnabled) setDetailedEnabled(true);
  }, []);

  const { data: detailed, isLoading: detailedLoading } = useDetailedAnalytics(detailedEnabled);

  if (cacheLoading || !cache) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto px-2 pt-8 sm:pt-12 sm:px-4 md:px-8 space-y-6 pb-20">

      <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 leading-none">Performance</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-primary/40 rounded-full" />
            {cache.predictive_burnout_warning && (
              <span className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">
                {cache.predictive_burnout_warning}
              </span>
            )}
          </div>
        </div>
      </div>

      <TabSwitcher active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SummaryView cache={cache} detailed={detailed} />
          </motion.div>
        )}

        {activeTab === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {detailedLoading || !detailed ? (
              <PageLoader />
            ) : (
              <DetailedView data={detailed} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
