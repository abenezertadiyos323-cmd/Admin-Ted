import type { Thread } from '../types';
import { formatRelativeTime, getCustomerName, truncate } from '../lib/utils';

interface ThreadCardProps {
  thread: Thread;
  onClick: () => void;
}

export default function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const isUnread = thread.unreadCount > 0;
  const fullName = getCustomerName(thread.customerFirstName, thread.customerLastName);
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-amber-500', 'bg-red-500', 'bg-indigo-500',
  ];
  const colorIdx = fullName.charCodeAt(0) % avatarColors.length;

  return (
    <button
      onClick={onClick}
      className="bg-white w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm ${avatarColors[colorIdx]}`}>
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
            {fullName}
          </span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
            {formatRelativeTime(thread.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate flex-1 ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
            {thread.lastMessagePreview
              ? truncate(thread.lastMessagePreview, 50)
              : 'No messages yet'}
          </p>
          {isUnread && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
