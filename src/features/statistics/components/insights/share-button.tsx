import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InsightCardData } from '@/utils/insights-engine';
import type { InsightTheme } from './insight-themes';
import { renderShareCardToCanvas } from './share-card-renderer';
import { shareToSocial, downloadShareImage, copyToClipboard } from '@/utils/share-utils';

interface ShareButtonProps {
  cardData: InsightCardData;
  theme: InsightTheme;
  index: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ cardData, theme, index }) => {
  const [sharing, setSharing] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSharing(true);
    
    try {
      const blob = await renderShareCardToCanvas(cardData, theme, 'story');
      const shared = await shareToSocial(blob, 'Check out my Legacy status card!');
      
      if (shared) {
        toast.success('Shared to WhatsApp Status!');
      } else {
        const copied = await copyToClipboard(blob);
        downloadShareImage(blob, `legacy-status-${index + 1}.png`);
        if (copied) {
          toast.success('Copied to clipboard & downloading!');
        } else {
          toast.success('Downloading status card!');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Could not generate share card');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleShare}
        disabled={sharing}
        className="p-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white transition-all active:scale-95 shadow-xl shadow-emerald-500/30 border border-emerald-400/30 flex items-center justify-center disabled:opacity-50"
        title="Share as WhatsApp Status"
      >
        {sharing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Share2 size={20} />
        )}
      </button>
    </div>
  );
};
