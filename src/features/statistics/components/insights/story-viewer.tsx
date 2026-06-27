import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InsightCardData } from '@/utils/insights-engine';
import { getInsightTheme } from './insight-themes';
import { InsightCard } from './insight-card';
import { ShareButton } from './share-button'; // Core sharing widget

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  cards: InsightCardData[];
  hashSeed: string; // Used to seed deterministic theme selection
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ isOpen, onClose, cards, hashSeed }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const duration = 6000; // 6 seconds per slide
  const step = 60; // interval update rate in ms

  // Reset indices on open
  useEffect(() => {
    if (isOpen) {
      setActiveIdx(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen]);

  // Handle slide progress counting
  useEffect(() => {
    if (!isOpen || cards.length === 0) return;

    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const startTime = Date.now() - (progress / 100) * duration;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(progressIntervalRef.current!);
        handleNext();
      }
    }, step);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, activeIdx, isPaused, cards.length]);

  const handleNext = () => {
    setProgress(0);
    setActiveIdx((prev) => {
      if (prev >= cards.length - 1) {
        onClose(); // auto close when finished
        return prev;
      }
      return prev + 1;
    });
  };

  const handlePrev = () => {
    setProgress(0);
    setActiveIdx((prev) => (prev <= 0 ? 0 : prev - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cards.length]);

  if (!isOpen || cards.length === 0) return null;

  const currentCard = cards[activeIdx];
  const currentTheme = getInsightTheme(activeIdx, hashSeed);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 touch-none select-none"
      >
        {/* Main Content Area */}
        <div className="relative w-full max-w-[420px] h-[calc(100vh-6rem)] sm:h-[680px] flex flex-col justify-between">
          
          {/* Top Segmented Progress Indicators */}
          <div className="absolute top-4 inset-x-0 flex gap-1 px-4 z-50">
            {cards.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all ease-linear"
                  style={{
                    width: idx < activeIdx ? '100%' : idx === activeIdx ? `${progress}%` : '0%',
                    transitionDuration: idx === activeIdx ? `${step}ms` : '0ms'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Floating top right close icon */}
          <div className="absolute top-8 right-4 z-50">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/40 border border-white/10 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all active:scale-95 shadow-lg"
              title="Close reflections"
            >
              <X size={16} />
            </button>
          </div>

          {/* Left/Right Invisible Tap Zones for Mobile Quick Navigation */}
          <div className="absolute inset-x-0 top-16 bottom-20 flex z-30 pointer-events-none">
            <div 
              className="w-1/4 h-full pointer-events-auto cursor-w-resize"
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => { setIsPaused(false); handlePrev(); }}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => { setIsPaused(false); handlePrev(); }}
            />
            <div 
              className="w-2/4 h-full pointer-events-auto"
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
            />
            <div 
              className="w-1/4 h-full pointer-events-auto cursor-e-resize"
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => { setIsPaused(false); handleNext(); }}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => { setIsPaused(false); handleNext(); }}
            />
          </div>

          {/* The Active Card container with spring physics slide animations */}
          <div className="flex-1 mt-18 mb-4 rounded-[2rem] overflow-hidden relative shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ x: 60, opacity: 0, scale: 0.98 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -60, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full h-full"
              >
                <InsightCard data={currentCard} theme={currentTheme} index={activeIdx} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom user action & navigation toolbar */}
          <div className="flex items-center justify-between px-4 pb-2 z-40 gap-4">
            <button
              onClick={handlePrev}
              disabled={activeIdx === 0}
              className="p-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Glowing, user-friendly Share Button centered at the bottom of screen */}
            <div className="shadow-lg shadow-black/40 rounded-full">
              <ShareButton cardData={currentCard} theme={currentTheme} index={activeIdx} />
            </div>

            <button
              onClick={handleNext}
              disabled={activeIdx === cards.length - 1}
              className="p-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 backdrop-blur-md transition-all active:scale-90"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
