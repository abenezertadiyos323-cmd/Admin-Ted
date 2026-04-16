import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  ArrowRightLeft, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Phone,
  CircleDashed,
  Loader2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';

type ExchangeFilter = 'all' | 'pending' | 'quoted' | 'accepted' | 'completed';

export default function Exchanges() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ExchangeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const exchanges = useQuery(api.exchanges.listExchanges);

  const filteredExchanges = (exchanges || []).filter(ex => {
    // Apply status filter
    if (filter === 'pending' && ex.status !== 'Pending') return false;
    if (filter === 'quoted' && ex.status !== 'Quoted') return false;
    if (filter === 'accepted' && ex.status !== 'Accepted') return false;
    if (filter === 'completed' && ex.status !== 'Completed') return false;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const model = `${ex.tradeInBrand} ${ex.tradeInModel}`.toLowerCase();
      const telegram = ex.telegramId.toLowerCase();
      return model.includes(query) || telegram.includes(query);
    }

    return true;
  });

  if (exchanges === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'var(--primary)';
      case 'Quoted': return '#3B82F6';
      case 'Accepted': return '#F59E0B';
      case 'Completed': return '#10B981';
      case 'Rejected': return '#EF4444';
      default: return 'var(--muted)';
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Exchanges" />

      {/* Search & Filters */}
      <div className="px-4 py-2 bg-surface sticky top-0 z-20 border-b border-border">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search exchanges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['all', 'pending', 'quoted', 'accepted', 'completed'] as ExchangeFilter[]).map((f) => (
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

      {/* List */}
      <div className="p-4">
        {filteredExchanges.length === 0 ? (
          <EmptyState 
            icon={<ArrowRightLeft size={48} />}
            title="No exchanges found"
            subtitle={searchQuery ? "Try a different search term" : "No exchange requests to show"}
          />
        ) : (
          <div className="space-y-3">
            {filteredExchanges.map((ex) => (
              <button
                key={ex._id}
                onClick={() => navigate(`/exchanges/${ex._id}`)}
                className="w-full text-left bg-surface border border-border rounded-2xl p-4 active:scale-[0.98] transition-all flex flex-col gap-3 relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-primary">
                      <Phone size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text">
                        {ex.tradeInBrand} {ex.tradeInModel}
                      </h3>
                      <p className="text-[10px] text-muted font-black uppercase tracking-wider">
                        {ex.tradeInStorage} · {ex.tradeInCondition}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted font-medium mb-1">
                      {new Date(ex.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-2 border border-border">
                      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: getStatusColor(ex.status) }}>
                        {ex.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <ArrowRightLeft size={12} className="text-muted" />
                  <p className="text-[10px] text-muted truncate">
                    Desired: <span className="font-bold text-text">iPhone 15 Pro (128GB)</span>
                  </p>
                </div>

                <ChevronRight size={16} className="text-border absolute right-4 bottom-4" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
