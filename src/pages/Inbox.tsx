import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  MessageSquare, 
  Search, 
  Clock, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  ChevronRight,
  User,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';

type InboxFilter = 'all' | 'unread' | 'waiting' | 'done';

export default function Inbox() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const threads = useQuery(api.threads.listThreads);

  const filteredThreads = useMemo(() => {
    if (!threads) return [];
    
    return threads.filter(thread => {
      // Apply status filter
      if (filter === 'unread' && thread.status !== 'new') return false;
      if (filter === 'waiting' && thread.status === 'done') return false;
      if (filter === 'done' && thread.status !== 'done') return false;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = `${thread.customerFirstName} ${thread.customerLastName || ''}`.toLowerCase();
        const username = (thread.customerUsername || '').toLowerCase();
        return name.includes(query) || username.includes(query);
      }

      return true;
    });
  }, [threads, filter, searchQuery]);

  if (threads === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
      case 'new': return <Circle size={12} fill="var(--primary)" />;
      case 'seen': return <Circle size={12} fill="#3B82F6" />;
      case 'done': return <CheckCircle2 size={12} className="text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Inbox" />

      {/* Search & Filters */}
      <div className="px-4 py-2 bg-surface sticky top-0 z-20 border-b border-border">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['all', 'unread', 'waiting', 'done'] as InboxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filter === f ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-muted border border-border'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Threads List */}
      <div className="p-4">
        {filteredThreads.length === 0 ? (
          <EmptyState 
            icon={<MessageSquare size={48} />}
            title="No conversations found"
            subtitle={searchQuery ? "Try a different search term" : "Your inbox is clear"}
          />
        ) : (
          <div className="space-y-3">
            {filteredThreads.map((thread) => (
              <button
                key={thread._id}
                onClick={() => navigate(`/inbox/${thread._id}`)}
                className="w-full text-left bg-surface border border-border rounded-2xl p-4 active:scale-[0.98] transition-all flex items-start gap-4 relative"
              >
                {/* Avatar / Icon */}
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
                  
                  <p className="text-xs text-muted line-clamp-2 mb-2 pr-4">
                    {thread.lastMessagePreview || 'No messages yet'}
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-2 border border-border">
                      {getStatusIcon(thread.status)}
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getStatusColor(thread.status) }}>
                        {thread.status}
                      </span>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-primary-fg text-[10px] font-black">
                        {thread.unreadCount} NEW
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-border absolute right-4 top-1/2 -translate-y-1/2" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
