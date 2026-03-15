import React from 'react';
import { motion } from 'framer-motion';

export const PageLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background gap-6">
        <motion.img
            src="/white-logo.svg"
            alt="Legacy"
            className="w-14 h-14 object-contain opacity-60"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/20 animate-pulse">Loading</p>
    </div>
);
