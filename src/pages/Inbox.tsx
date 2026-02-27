import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const FILTER_LABELS: Record<string, string> = {
    waiting30:    'Waiting >30 min',
    followUp:     'Follow Up',
    unanswered:   'Unanswered today',
    firstContact: 'First contact',
  };
  const filterLabel = filterParam ? (FILTER_LABELS[filterParam] ?? filterParam) : null;

  const [activeTab, setActiveTab] = useState<ThreadCategory | 'all'>('hot');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({ hot: 0, warm: 0, cold: 0 });

  const didApplyFilter = useRef(false);
  useEffect(() => {
    if (filterParam && !didApplyFilter.current) {
      didApplyFilter.current = true;
      setActiveTab('all');
    }
  }, [filterParam]);

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 shrink-0 bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Inbox</h1>
          {filterLabel && (
            <div className="mx-4 mb-2 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-blue-700">Filtering: {filterLabel}</span>
            </div>
          )}
        </div>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => {
            setLoading(true);
            setActiveTab(key as ThreadCategory | 'all');
          }}
        />
      </div>

      {/* Scrollable Thread List */}
      <div className="flex-1 overflow-y-auto pb-20 bg-white mt-2 rounded-t-2xl shadow-sm">
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
