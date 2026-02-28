import type { CSSProperties } from 'react';

interface BadgeProps {
  /** Raw count value. Badge is hidden when count === 0. */
  count: number;
  /** When true, plays the badge-pop keyframe animation. */
  pop?: boolean;
  /** Extra inline styles (e.g. absolute positioning from the parent). */
  style?: CSSProperties;
  /** Extra class names for positioning / spacing. */
  className?: string;
}

/**
 * Unified notification badge.
 *
 * Design rules:
 *   background : var(--badge)  — #FF2D55 red, always
 *   text       : white
 *   ring       : 1.5px solid var(--bg) so it reads cleanly on dark surfaces
 *   animation  : badge-pop keyframe (defined in index.css) when pop=true
 */
export function Badge({ count, pop = false, style, className = '' }: BadgeProps) {
  if (count === 0) return null;

  const label        = count >= 100 ? '99+' : String(count);
  const isMultiDigit = count >= 10;

  return (
    <span
      // Re-keying on each pop ensures the CSS animation restarts cleanly
      // even if the browser hasn't fully flushed the previous run.
      key={pop ? 'pop' : 'idle'}
      className={`inline-flex items-center justify-center font-bold text-white rounded-full ${
        pop ? 'animate-badge-pop' : ''
      } ${className}`.trim()}
      style={{
        background:  'var(--badge)',
        border:      '1.5px solid var(--bg)',
        boxShadow:   '0 1px 4px rgba(0,0,0,0.5)',
        fontSize:    '10px',
        lineHeight:  1,
        height:      '18px',
        minWidth:    isMultiDigit ? 'auto' : '18px',
        padding:     isMultiDigit ? '0 5px' : '0',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
