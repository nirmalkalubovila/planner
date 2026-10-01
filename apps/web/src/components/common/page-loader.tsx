import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const GOLD = '#D2A226';
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Gold only, no text: a fine gold line opens from the centre, and a pale-gold glint travels along it in a
 * slow loop. Shows for under a second on most pages, so it is visible from the first frame.
 */
export const PageLoader: React.FC = () => {
    const reduce = !!useReducedMotion();

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background select-none" role="progressbar" aria-label="Loading">
            <motion.div
                aria-hidden
                className="relative h-[2px] w-40 sm:w-56 overflow-hidden rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scaleX: 0.15 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, ease: EASE }}
            >
                {!reduce && (
                    <motion.span
                        className="absolute inset-y-0 left-0 block w-1/3"
                        style={{ background: `linear-gradient(90deg, transparent, #fff1bf, ${GOLD}, transparent)` }}
                        initial={{ x: '-100%' }}
                        animate={{ x: '300%' }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}
            </motion.div>
        </div>
    );
};
