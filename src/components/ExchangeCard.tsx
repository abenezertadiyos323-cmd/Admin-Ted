import { ArrowRight } from 'lucide-react';
import type { Exchange } from '../types';
import { formatETB, formatRelativeTime, getCustomerName } from '../lib/utils';

interface ExchangeCardProps {
  exchange: Exchange;
  onClick: () => void;
}

// Dark-theme status badge styles — semantic colors that pop on dark surfaces
function getStatusStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case 'Pending':   return { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' };  // blue
    case 'Quoted':    return { bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA' };  // violet
    case 'Accepted':  return { bg: 'rgba(245,196,0,0.15)',   color: '#F5C400' };  // primary yellow
    case 'Completed': return { bg: 'rgba(16,185,129,0.15)',  color: '#34D399' };  // green
    case 'Rejected':  return { bg: 'rgba(239,68,68,0.15)',   color: '#F87171' };  // red
    default:          return { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' };  // muted
  }
}

export default function ExchangeCard({ exchange, onClick }: ExchangeCardProps) {
  const statusStyle = getStatusStyle(exchange.status);
  const customerName = exchange.thread
    ? getCustomerName(exchange.thread.customerFirstName, exchange.thread.customerLastName)
    : 'Unknown';

  return (
    <button
      onClick={onClick}
      className="card-interactive p-4 w-full text-left"
    >
      {/* Header: avatar + name + status badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ background: 'var(--surface-2)', color: 'var(--primary)' }}
          >
            {customerName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {customerName}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: statusStyle.bg, color: statusStyle.color }}
        >
          {exchange.status}
        </span>
      </div>

      {/* Trade-in → Desired */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex-1 rounded-xl p-2.5"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>TRADE-IN</p>
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>
            {exchange.tradeInBrand} {exchange.tradeInModel}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {exchange.tradeInStorage} · {exchange.tradeInCondition}
          </p>
        </div>
        <ArrowRight size={16} className="flex-shrink-0" style={{ color: 'var(--muted)' }} />
        <div
          className="flex-1 rounded-xl p-2.5"
          style={{ background: 'rgba(245,196,0,0.06)', border: '1px solid rgba(245,196,0,0.15)' }}
        >
          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--primary)' }}>WANTS</p>
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>
            {exchange.desiredPhone
              ? exchange.desiredPhone.phoneType
              : 'Unknown Phone'}
          </p>
          {exchange.desiredPhone?.storage && (
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {exchange.desiredPhone.storage}
            </p>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Trade-in Value</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {formatETB(exchange.finalTradeInValue)}
            </p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Customer Pays</p>
            <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {formatETB(exchange.finalDifference)}
            </p>
          </div>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {formatRelativeTime(exchange.createdAt)}
        </span>
      </div>

      {/* Budget flag */}
      {exchange.budgetMentionedInSubmission && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(217,119,6,0.15)', color: '#FBBF24' }}
          >
            💬 Budget mentioned
          </span>
        </div>
      )}
    </button>
  );
}
