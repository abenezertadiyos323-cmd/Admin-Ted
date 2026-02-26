import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import TabBar from '../components/TabBar';
import ExchangeCard from '../components/ExchangeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getExchanges } from '../lib/api';
import type { Exchange, ThreadCategory } from '../types';

const TABS: { key: ThreadCategory; label: string; emoji: string }[] = [
  { key: 'hot', label: 'Hot', emoji: '🔥' },
  { key: 'warm', label: 'Warm', emoji: '☀️' },
  { key: 'cold', label: 'Cold', emoji: '🧊' },
];

const EMPTY_MESSAGES: Record<ThreadCategory, { title: string; subtitle: string }> = {
  hot: { title: 'No hot exchanges', subtitle: 'Hot exchanges: submitted <2h, budget mentioned, or value >50K ETB' },
  warm: { title: 'No warm exchanges', subtitle: 'Warm exchanges: customer clicked Continue or sent a message' },
  cold: { title: 'No cold exchanges', subtitle: 'Cold exchanges: no engagement for 24+ hours' },
};

export default function Exchanges() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ThreadCategory>('hot');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<ThreadCategory, number>>({ hot: 0, warm: 0, cold: 0 });

  useEffect(() => {
    Promise.all([
      getExchanges({ category: 'hot' }),
      getExchanges({ category: 'warm' }),
      getExchanges({ category: 'cold' }),
    ]).then(([hot, warm, cold]) => {
      setCounts({ hot: hot.length, warm: warm.length, cold: cold.length });
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getExchanges({ category: activeTab }).then((data) => {
      setExchanges(data);
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
          <h1 className="text-xl font-bold text-gray-900 mb-3">Exchanges</h1>
        </div>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => {
            setLoading(true);
            setActiveTab(key as ThreadCategory);
          }}
        />
      </div>

      {/* Exchange List */}
      <div className="px-4 py-3">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : exchanges.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight size={28} />}
            title={empty.title}
            subtitle={empty.subtitle}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium">
              {exchanges.length} exchange{exchanges.length !== 1 ? 's' : ''}
            </p>
            {exchanges.map((exchange) => (
              <ExchangeCard
                key={exchange._id}
                exchange={exchange}
                onClick={() => navigate(`/exchanges/${exchange._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
