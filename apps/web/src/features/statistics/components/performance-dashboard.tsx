import React, { Suspense, lazy, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStats } from '../hooks/use-user-stats';
import { useDetailedAnalytics } from '../hooks/use-detailed-stats';
import { PageLoader } from '@/components/common/page-loader';
import { SummaryView } from './summary-view';

/**
 * The Performance page shows the Summary only. The Detailed and Insights tabs are kept in the codebase
 * but switched off: set this to true to bring them back. While it is false their code is never loaded
 * (they are lazy imports) and their data hooks never run, so they cost no memory or requests.
 */
const SHOW_ADVANCED_TABS = false;

const DetailedView = lazy(() => import('./detailed-view').then((m) => ({ default: m.DetailedView })));
const InsightsView = lazy(() => import('./insights/insights-view').then((m) => ({ default: m.InsightsView })));

type Tab = 'summary' | 'detailed' | 'insights';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'insights', label: 'Insights' },
];

const TabSwitcher: React.FC<{ active: Tab; onChange: (t: Tab) => void }> = ({ active, onChange }) => (
  <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border w-fit">
    {TABS.map(tab => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={cn(
          'relative px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors duration-150',
          active === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {active === tab.id && (
          <motion.span
            layoutId="active-tab-pill"
            className="absolute inset-0 rounded-full bg-accent border border-border"
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

  // The Summary itself is built from the detailed analytics, so this query stays on
  const { data: detailed, isLoading: detailedLoading } = useDetailedAnalytics(true);

  if (cacheLoading || !cache) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">

      <div className="flex justify-between items-end mb-4 border-b border-border pb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">Performance</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-primary/40 rounded-full" />
            {cache.predictive_burnout_warning && (
              <span className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">
                {cache.predictive_burnout_warning}
              </span>
            )}
          </div>
        </div>

        {/* Small Question Mark with Tooltip on Hover */}
        <div className="relative group mb-1">
          <Link
            to="/statistics/calculations"
            className="flex items-center justify-center p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
            aria-label="How calculations work"
          >
            <HelpCircle size={16} />
          </Link>
          
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50">
            <div className="bg-popover text-popover-foreground border border-border text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
              How calculations work
            </div>
          </div>
        </div>
      </div>

      {SHOW_ADVANCED_TABS && <TabSwitcher active={activeTab} onChange={setActiveTab} />}

      <AnimatePresence mode="wait">
        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SummaryView
              cache={cache}
              detailed={detailed}
              onSwitchToInsights={SHOW_ADVANCED_TABS ? () => setActiveTab('insights') : undefined}
            />
          </motion.div>
        )}

        {SHOW_ADVANCED_TABS && activeTab === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<PageLoader />}>
              {detailedLoading || !detailed ? <PageLoader /> : <DetailedView data={detailed} />}
            </Suspense>
          </motion.div>
        )}

        {SHOW_ADVANCED_TABS && activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<PageLoader />}>
              <InsightsView />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
