import React, { Suspense } from 'react';
import { PageLoader } from '@/components/common/page-loader';
import { PerformanceDashboard } from './components/performance-dashboard';

export const StatisticsPage: React.FC = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <div className="w-full h-full flex flex-col bg-background relative overflow-y-auto custom-scrollbar">
                <PerformanceDashboard />
            </div>
        </Suspense>
    );
};
