import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackLoaderProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const FeedbackLoader: React.FC<FeedbackLoaderProps> = ({
  isLoading,
  message = 'Loading...',
  children,
}) => (
  <div className="relative">
    <div
      className={
        isLoading
          ? 'opacity-30 pointer-events-none select-none transition-opacity duration-300'
          : 'transition-opacity duration-300'
      }
    >
      {children}
    </div>

    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
        >
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl">
            <div className="h-7 w-7 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-white/50 animate-pulse">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
