import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** Shared by combo-chain, forge-system, heartbeat-system, daily-boss-fight —
 * web's identical `useState(false) + useRef(prev) + setTimeout` "flash when
 * this value increases" pattern, factored out once instead of copy-pasted
 * four times. */
export function useFlashOnIncrease(value: number, durationMs = 400): boolean {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value > prev.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), durationMs);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, durationMs]);

  return flash;
}

/** Shared "celebration" loop — every theme's 100%-complete state uses a
 * continuous pulse (web's `animate-pulse`/`animate-bounce`). One
 * Animated.loop instead of re-deriving per theme. */
export function usePulseLoop(active: boolean, min = 0.94, max = 1.08, durationMs = 700) {
  // useState's lazy initializer rather than `useRef(...).current` — same
  // single stable instance, without a ref read during render.
  const [value] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!active) {
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: durationMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: durationMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, value, durationMs]);

  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [min, max] });
  return scale;
}
