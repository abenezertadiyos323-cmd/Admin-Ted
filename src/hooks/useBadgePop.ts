import { useState, useEffect } from 'react';

/**
 * useBadgePop.ts
 * Returns a boolean that flips to true briefly when the input value changes.
 * Used to trigger the 'animate-badge-pop' CSS animation in the UI.
 */
export function useBadgePop(value: number | undefined) {
  const [shouldPop, setShouldPop] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    // Only pop if the value actually INCREASED (new messages/exchanges)
    if (value !== undefined && prevValue !== undefined && value > prevValue) {
      setShouldPop(true);
      
      // Reset after animation finishes (matches CSS duration 220ms)
      const timer = setTimeout(() => {
        setShouldPop(false);
      }, 250);

      return () => clearTimeout(timer);
    }
    
    setPrevValue(value);
  }, [value, prevValue]);

  return shouldPop;
}
