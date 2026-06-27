import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { InsightCardData } from '@/utils/insights-engine';
import type { InsightTheme } from './insight-themes';
import { renderShareCardToCanvas, type ShareFormat } from './share-card-renderer';
import { shareToSocial, downloadShareImage, copyToClipboard } from '@/utils/share-utils';

interface ShareButtonProps {
  cardData: InsightCardData;
  theme: InsightTheme;
  index: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ cardData, theme, index }) => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ShareFormat>('story');

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    
    try {
      // 1. Generate image blob
      const blob = await renderShareCardToCanvas(cardData, theme, format);
      
      // 2. Try native mobile share sheet
      const shared = await shareToSocial(blob, 'Check out my Legacy wrapped card! ⚡');
      
      if (shared) {
        toast.success('Shared successfully!');
      } else {
        // Desktop / Fallback path: copy to clipboard AND download
        const copied = await copyToClipboard(blob);
        downloadShareImage(blob, `legacy-slide-${index + 1}.png`);
        
        if (copied) {
          toast.success('Copied to clipboard and downloading image!');
        } else {
          toast.success('Downloading share card image!');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Could not generate share card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/15 shadow-2xl">
        {/* Format Selectors */}
        <button
          onClick={() => setFormat('story')}
          className={cn(
            "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200",
            format === 'story' 
              ? "bg-white text-black font-extrabold shadow-sm" 
              : "text-white/60 hover:text-white/90 hover:bg-white/5"
          )}
        >
          Story
        </button>
        <button
          onClick={() => setFormat('post')}
          className={cn(
            "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-200",
            format === 'post' 
              ? "bg-white text-black font-extrabold shadow-sm" 
              : "text-white/60 hover:text-white/90 hover:bg-white/5"
          )}
        >
          Post
        </button>
        
        <div className="h-4 w-px bg-white/10 mx-0.5" />
        
        {/* Main Trigger Button */}
        <button
          onClick={handleShare}
          disabled={loading}
          className={cn(
            "p-2 rounded-full transition-all duration-200 flex items-center justify-center relative overflow-hidden group active:scale-95",
            theme.accentTextColor.includes('emerald') 
              ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-md shadow-emerald-500/20" 
              : "bg-white text-black hover:bg-white/90 shadow-md"
          )}
          title="Share wrapped card"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 size={13} className="group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};
