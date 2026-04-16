import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

/**
 * Shared badge logic that pops when its value changes.
 * Used for Inbox and Exchanges in the bottom nav.
 */
export default function Badge({ 
  type, 
  className = "" 
}: { 
  type: 'inbox' | 'exchanges';
  className?: string;
}) {
  const count = useQuery(
    type === 'inbox' 
      ? api.threads.getUnreadCount 
      : api.exchanges.getPendingCount
  );

  if (!count || count <= 0) return null;

  return (
    <span 
      key={count} // Re-mount or re-animate when count changes
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-badge text-[10px] font-black text-white flex items-center justify-center animate-badge-pop shadow-sm z-10 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
