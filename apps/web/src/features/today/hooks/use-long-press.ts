import React, { useCallback, useRef } from 'react';

/**
 * Press and hold (touch or mouse) or right-click to trigger `onLongPress`. A normal tap or click is left alone,
 * and scrolling or dragging cancels the hold. Call `consumeLongPress()` at the start of the click handler so the
 * click that follows a long press does not also fire the normal action.
 */
export function useLongPress<T>(onLongPress: (item: T) => void, ms = 450) {
    const timer = useRef<number | null>(null);
    const fired = useRef(false);
    const origin = useRef({ x: 0, y: 0 });

    const cancel = useCallback(() => {
        if (timer.current !== null) {
            window.clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    const bind = (item: T) => ({
        onPointerDown: (e: React.PointerEvent) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            fired.current = false;
            origin.current = { x: e.clientX, y: e.clientY };
            cancel();
            timer.current = window.setTimeout(() => {
                timer.current = null;
                fired.current = true;
                navigator.vibrate?.(8);
                onLongPress(item);
            }, ms);
        },
        onPointerMove: (e: React.PointerEvent) => {
            if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) cancel();
        },
        onPointerUp: cancel,
        onPointerLeave: cancel,
        onPointerCancel: cancel,
        onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            cancel();
            fired.current = true;
            onLongPress(item);
        },
    });

    const consumeLongPress = () => {
        const was = fired.current;
        fired.current = false;
        return was;
    };

    return { bind, consumeLongPress };
}
