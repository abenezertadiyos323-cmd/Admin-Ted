import type { Exchange } from '../types';
import { ArrowRightLeft, Clock, Phone, Smartphone, ChevronRight } from 'lucide-react';

export default function ExchangeCard({ 
  exchange, 
  onClick 
}: { 
  exchange: any; 
  onClick?: () => void 
}) {
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
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-2xl p-4 active:scale-[0.98] transition-all flex flex-col gap-3 relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-primary border border-border">
            <Phone size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">
              {exchange.tradeInBrand} {exchange.tradeInModel}
            </h3>
            <p className="text-[10px] text-muted font-black uppercase tracking-wider">
              {exchange.tradeInStorage} · {exchange.tradeInCondition}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted font-medium mb-1">
            {new Date(exchange.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-2 border border-border">
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: getStatusColor(exchange.status) }}>
              {exchange.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <ArrowRightLeft size={12} className="text-muted" />
        <p className="text-[10px] text-muted truncate">
          Requesting: <span className="font-bold text-text">iPhone 15 Pro (128GB)</span>
        </p>
      </div>

      <ChevronRight size={16} className="text-border absolute right-4 bottom-4" />
    </button>
  );
}
