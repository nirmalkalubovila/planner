import { useEffect, useRef, useCallback } from 'react';

export const useSimulationTimers = () => {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const registerTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(id);
    }, delay);
    timeoutsRef.current.add(id);
    return id;
  }, []);

  const registerInterval = useCallback((callback: () => void, delay: number) => {
    const id = setInterval(callback, delay);
    intervalsRef.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current.clear();
    intervalsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    setTimeout: registerTimeout,
    setInterval: registerInterval,
    clearAllTimers
  };
};
