import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import TabBar from '../components/TabBar';
import ThreadCard from '../components/ThreadCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getThreads } from '../lib/api';
import type { Thread, ThreadCategory } from '../types';

const TABS: { key: ThreadCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'hot', label: 'Hot', emoji: '🔥' },
  { key: 'warm', label: 'Warm', emoji: '☀️' },
  { key: 'cold', label: 'Cold', emoji: '🧊' },
];

const EMPTY_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  hot: { title: 'No hot threads', subtitle: 'Hot threads appear when customers message recently or mention budget' },
  warm: { title: 'No warm threads', subtitle: 'Warm threads appear when customers are engaged' },
  cold: { title: 'No cold threads', subtitle: 'Cold threads appear when exchanges are inactive for 24+ hours' },
  all: { title: 'No threads yet', subtitle: 'Customer conversations will appear here' },
};

export default function Inbox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ThreadCategory | 'all'>('hot');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({ hot: 0, warm: 0, cold: 0 });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getThreads('hot'),
      getThreads('warm'),
      getThreads('cold'),
    ]).then(([hot, warm, cold]) => {
      setCounts({ hot: hot.length, warm: warm.length, cold: cold.length });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const category = activeTab === 'all' ? undefined : activeTab;
    getThreads(category).then((data) => {
      setThreads(data);
      setLoading(false);
    });
  }, [activeTab]);

  const tabs = TABS.map((t) => ({
    ...t,
    count: counts[t.key] ?? 0,
  }));

  const empty = EMPTY_MESSAGES[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Inbox</h1>
        </div>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as ThreadCategory | 'all')}
        />
      </div>

      {/* Thread List */}
      <div className="bg-white mt-2 rounded-t-2xl shadow-sm">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : threads.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={28} />}
            title={empty.title}
            subtitle={empty.subtitle}
          />
        ) : (
          <div>
            {threads.map((thread) => (
              <ThreadCard
                key={thread._id}
                thread={thread}
                onClick={() => navigate(`/inbox/${thread._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
