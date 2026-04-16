import { Circle, User, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ThreadCard({ 
  thread, 
  onClick 
}: { 
  thread: any; 
  onClick: () => void 
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'var(--primary)';
      case 'seen': return '#3B82F6';
      case 'done': return '#10B981';
      default: return 'var(--muted)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Circle size={10} fill="var(--primary)" />;
      case 'seen': return <Circle size={10} fill="#3B82F6" />;
      case 'done': return <CheckCircle2 size={10} className="text-green-500" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-2xl p-4 active:scale-[0.98] transition-all flex items-start gap-4 relative"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0 border border-border">
        {thread.customerUsername ? (
          <span className="text-lg font-bold text-primary">{thread.customerFirstName.charAt(0)}</span>
        ) : (
          <User size={24} className="text-muted" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-text truncate">
            {thread.customerFirstName} {thread.customerLastName || ''}
          </h3>
          <span className="text-[10px] text-muted flex-shrink-0">
             {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <p className="text-xs text-muted line-clamp-1 mb-2 pr-4">
          {thread.lastMessagePreview || 'No messages'}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-2 border border-border">
            {getStatusIcon(thread.status)}
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: getStatusColor(thread.status) }}>
              {thread.status}
            </span>
          </div>
          {thread.unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-badge text-[9px] font-black text-white">
              {thread.unreadCount} NEW
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-border absolute right-4 top-1/2 -translate-y-1/2" />
    </button>
  );
}
