import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const GOLD = '#D2A226';
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Text-only loader: one word set like a film title. It resolves out of a soft blur while its
 * letter-spacing opens up, then a slow gold shimmer keeps moving across it. A hairline fades in
 * below. It is legible from the first frame, since it often shows for under a second. No logo, no ring, no brand name.
 */
export const PageLoader: React.FC = () => {
    const reduce = !!useReducedMotion();

    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background select-none" role="progressbar" aria-label="Loading">
            <motion.span
                className="block text-lg sm:text-2xl font-semibold uppercase bg-clip-text text-transparent"
                style={{
                    // solid gold everywhere, with one pale-gold glint that travels across
                    backgroundImage: `linear-gradient(105deg, ${GOLD} 0%, ${GOLD} 40%, #fff1bf 50%, ${GOLD} 60%, ${GOLD} 100%)`,
                    backgroundSize: '250% 100%',
                }}
                initial={reduce ? { opacity: 0 } : { opacity: 0.25, filter: 'blur(3px)', letterSpacing: '0.34em', paddingLeft: '0.34em' }}
                animate={
                    reduce
                        ? { opacity: 1 }
                        : {
                              opacity: 1,
                              filter: 'blur(0px)',
                              letterSpacing: '0.5em',
                              paddingLeft: '0.5em',
                              backgroundPosition: ['100% 0%', '0% 0%'],
                          }
                }
                transition={{
                    opacity: { duration: 0.25, ease: 'easeOut' },
                    filter: { duration: 0.5, ease: EASE },
                    letterSpacing: { duration: 1.4, ease: EASE },
                    paddingLeft: { duration: 1.4, ease: EASE },
                    backgroundPosition: { duration: 2.2, repeat: Infinity, ease: 'linear' },
                }}
            >
                Execute
            </motion.span>

            <motion.span
                aria-hidden
                className="mt-4 block h-px w-16 sm:w-24"
                style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: [0, 0.9, 0.5], scaleX: 1 }}
                transition={{ duration: 1.4, delay: 0.15, ease: EASE }}
            />
        </div>
    );
};
