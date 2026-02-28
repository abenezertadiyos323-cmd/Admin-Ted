import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import TabBar from '../components/TabBar';
import ExchangeCard from '../components/ExchangeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { classifyCategory } from '../lib/utils';
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
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const FILTER_LABELS: Record<string, string> = {
    quoted: 'Open Quotes',
  };
  const filterLabel = filterParam ? (FILTER_LABELS[filterParam] ?? filterParam) : null;
  const [activeTab, setActiveTab] = useState<ThreadCategory>('hot');
  const rawExchanges = useQuery(api.exchanges.listExchanges, {});

  const exchangesWithCategory = useMemo(() => {
    if (!rawExchanges) return [] as Exchange[];
    return rawExchanges.map((ex) => ({
      ...ex,
      category: classifyCategory({
        createdAt: ex.createdAt,
        lastCustomerMessageAt: (ex.thread as any)?.lastCustomerMessageAt,
        lastCustomerMessageHasBudgetKeyword: ex.budgetMentionedInSubmission,
        priorityValueETB: ex.priorityValueETB,
        clickedContinue: ex.clickedContinue,
        hasCustomerMessaged: (ex.thread as any)?.hasCustomerMessaged,
        hasAdminReplied: (ex.thread as any)?.hasAdminReplied,
      }),
    })) as Exchange[];
  }, [rawExchanges]);

  const loading = rawExchanges === undefined;

  const counts = useMemo(() => ({
    hot: exchangesWithCategory.filter((e) => e.category === 'hot').length,
    warm: exchangesWithCategory.filter((e) => e.category === 'warm').length,
    cold: exchangesWithCategory.filter((e) => e.category === 'cold').length,
  }), [exchangesWithCategory]);

  const exchanges = useMemo(() =>
    exchangesWithCategory.filter((e) => e.category === activeTab),
  [exchangesWithCategory, activeTab]);

  const tabs = TABS.map((t) => ({
    ...t,
    count: counts[t.key] ?? 0,
  }));

  const empty = EMPTY_MESSAGES[activeTab];

  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* Title — NOT sticky, scrolls away */}
      <div className="px-4 pt-4 pb-3" style={{ background: 'var(--surface)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Exchanges</h1>
        {filterLabel && (
          <div
            className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
              Filtering: {filterLabel}
            </span>
          </div>
        )}
      </div>

      {/* Tabs row — sticky */}
      <div
        className="sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => {
            setActiveTab(key as ThreadCategory);
          }}
        />
      </div>

      {/* Exchange list */}
      <div className="px-4 py-3 pb-20" style={{ background: 'var(--bg)' }}>
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
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
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
