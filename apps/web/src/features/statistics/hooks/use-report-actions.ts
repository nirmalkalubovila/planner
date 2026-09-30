import { useCallback } from 'react';
import { toast } from '@llb/core';
import { shareToSocial, downloadShareImage } from '@/utils/share-utils';
import type { MilestoneStage } from '@/utils/milestone-engine';
import type { DetailedAnalytics } from './use-detailed-stats';
import { buildReportData } from '../lib/progress-report-data';
import { downloadProgressReportPdf } from '../lib/progress-report-pdf';
import { renderReportImage } from '../lib/progress-report-image';

/** The two ways a user takes their report with them: a full PDF, and an image made for social media. */
export function useReportActions(name: string | undefined, detailed: DetailedAnalytics | undefined) {
    const downloadPdf = useCallback(
        (stage?: MilestoneStage | null) => {
            if (!detailed) return;
            try {
                downloadProgressReportPdf(buildReportData(name ?? '', detailed, stage));
                toast.success('Your full report is downloading');
            } catch (err) {
                console.error(err);
                toast.error('Could not create your report');
            }
        },
        [name, detailed],
    );

    const shareImage = useCallback(
        async (stage?: MilestoneStage | null) => {
            if (!detailed) return;
            try {
                const data = buildReportData(name ?? '', detailed, stage);
                const blob = await renderReportImage(data);
                const shared = await shareToSocial(blob, `${data.headline.daysExecuted} days executed. My progress report from Legacy Life Builder.`);
                if (shared) {
                    toast.success('Shared');
                } else {
                    downloadShareImage(blob, `legacy-progress-${new Date().toISOString().slice(0, 10)}.png`);
                    toast.success('Your share image is downloading');
                }
            } catch (err) {
                console.error(err);
                toast.error('Could not create the image');
            }
        },
        [name, detailed],
    );

    return { downloadPdf, shareImage };
}
