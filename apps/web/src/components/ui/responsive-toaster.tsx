import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

const MOBILE_BREAKPOINT = 768; // md breakpoint - matches Tailwind

export const ResponsiveToaster: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'dark' }) => {
    const [position, setPosition] = useState<'top-right' | 'bottom-right'>(() =>
        typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT ? 'top-right' : 'bottom-right'
    );

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const handler = () => setPosition(mq.matches ? 'top-right' : 'bottom-right');
        handler(); // initial
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return (
        <Toaster
            position={position}
            theme={theme}
            richColors
            mobileOffset={14}
        />
    );
};
