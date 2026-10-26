import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for smooth ease-out count-up animation.
 * Optimized for zero main-thread thrashing and respects prefers-reduced-motion.
 */
export function useCountUp(endValue: number, durationMs: number = 1000, startNow: boolean = true): number {
  const [count, setCount] = useState(0);
  const lastValRef = useRef<number>(0);

  useEffect(() => {
    if (!startNow || endValue <= 0) return;

    // Honor accessibility: if user prefers reduced motion, set endValue immediately
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion) {
      setCount(endValue);
      lastValRef.current = endValue;
      return;
    }

    setCount(0);
    lastValRef.current = 0;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.floor(easeProgress * endValue);

      // Only dispatch state update if integer value has changed to avoid redundant renders
      if (nextVal !== lastValRef.current) {
        lastValRef.current = nextVal;
        setCount(nextVal);
      }

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        if (lastValRef.current !== endValue) {
          lastValRef.current = endValue;
          setCount(endValue);
        }
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [endValue, durationMs, startNow]);

  return startNow ? count : 0;
}

