import React from 'react';
import { motion } from 'framer-motion';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-50 select-none overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[150px]" />

      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8 relative z-10">
        
        {/* Logo and Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <img
            src="/white-logo.svg"
            alt="Legacy Life Builder Logo"
            className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          />
          <div className="flex flex-col items-start text-left">
            <span className="text-xl font-bold tracking-tight uppercase leading-none bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Legacy Life Builder
            </span>
            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase font-mono mt-1 select-none whitespace-nowrap">
              Public Beta
            </span>
          </div>
        </motion.div>

        {/* AI Animation GIF */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full aspect-square max-w-[280px] rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md p-6 flex items-center justify-center relative overflow-hidden shadow-2xl"
        >
          <img
            src="/ai-animation-white.gif"
            alt="AI Animation"
            className="w-full h-full object-contain mix-blend-screen opacity-90"
          />
        </motion.div>

        {/* Title and Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
            System Upgrade in Progress
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            We are currently fine-tuning our servers. Your data is completely safe. Please try again in a few minutes.
          </p>
        </motion.div>

        {/* Reload/Diagnostics Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-xs font-semibold text-zinc-300 cursor-pointer shadow-md"
        >
          Check Again
        </motion.button>

      </div>
    </div>
  );
};
