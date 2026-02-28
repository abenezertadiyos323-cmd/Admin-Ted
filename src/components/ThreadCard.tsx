import type { Thread } from '../types';
import { formatRelativeTime, getCustomerName, truncate } from '../lib/utils';
import { Badge } from './Badge';
import { useBadgePop } from '../hooks/useBadgePop';

interface ThreadCardProps {
  thread: Thread;
  onClick: () => void;
}

// Avatar palette — vivid enough to read against dark surface
const AVATAR_COLORS = [
  '#2563EB', // blue-600
  '#7C3AED', // violet-600
  '#059669', // emerald-600
  '#D97706', // amber-600
  '#DC2626', // red-600
  '#0891B2', // cyan-600
];

export default function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const isUnread = thread.unreadCount > 0;
  const fullName = getCustomerName(thread.customerFirstName, thread.customerLastName);
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarBg = AVATAR_COLORS[fullName.charCodeAt(0) % AVATAR_COLORS.length];

  // Pop animation — fires when unreadCount increases for this specific thread
  const { shouldPop } = useBadgePop(thread.unreadCount);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 active:opacity-70"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
        style={{ background: avatarBg }}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-sm"
            style={{
              fontWeight: isUnread ? 700 : 500,
              color: 'var(--text)',
            }}
          >
            {fullName}
          </span>
          <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: 'var(--muted)' }}>
            {formatRelativeTime(thread.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p
            className="text-xs truncate flex-1"
            style={{
              color: isUnread ? 'var(--text)' : 'var(--muted)',
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {thread.lastMessagePreview
              ? truncate(thread.lastMessagePreview, 50)
              : 'No messages yet'}
          </p>

          {/* Unread badge with pop animation */}
          {isUnread && (
            <Badge
              count={thread.unreadCount}
              pop={shouldPop}
              className="ml-2 flex-shrink-0"
            />
          )}
        </div>
      </div>
    </button>
  );
}
