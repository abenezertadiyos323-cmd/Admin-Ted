import { useEffect, useRef, useState } from 'react';

/**
 * Fires a brief "pop" flag when `currentCount` increases.
 *
 * Rules:
 * - undefined is treated as 0 but does NOT initialise the baseline — we wait
 *   for the first real server value so the initial data-load never triggers pop.
 * - Once we have a baseline, any increase sets shouldPop=true for POP_MS, then
 *   resets to false automatically.
 * - A plain re-render that doesn't change `currentCount` never re-triggers the
 *   effect (deps array: [currentCount]).
 */

const POP_MS = 220;

export function useBadgePop(currentCount: number | undefined): { shouldPop: boolean } {
  // null = "not yet seen a real server value"
  const prevRef  = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shouldPop, setShouldPop] = useState(false);

  useEffect(() => {
    // Still loading — skip; we don't want to animate the first data arrival
    if (currentCount === undefined) return;

    if (prevRef.current === null) {
      // First real value: establish baseline, no animation
      prevRef.current = currentCount;
      return;
    }

    if (currentCount > prevRef.current) {
      // Count went up — fire pop
      setShouldPop(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShouldPop(false);
        timerRef.current = null;
      }, POP_MS);
    }

    prevRef.current = currentCount;
  }, [currentCount]); // only re-runs when the count actually changes

  // Clean up on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { shouldPop };
}
