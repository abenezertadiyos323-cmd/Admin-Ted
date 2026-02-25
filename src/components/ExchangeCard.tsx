import { ArrowRight } from 'lucide-react';
import type { Exchange } from '../types';
import { formatETB, formatRelativeTime, getExchangeStatusColor, getCustomerName } from '../lib/utils';

interface ExchangeCardProps {
  exchange: Exchange;
  onClick: () => void;
}

export default function ExchangeCard({ exchange, onClick }: ExchangeCardProps) {
  const statusStyle = getExchangeStatusColor(exchange.status);
  const customerName = exchange.thread
    ? getCustomerName(exchange.thread.customerFirstName, exchange.thread.customerLastName)
    : 'Unknown';

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full text-left active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            {customerName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-900">{customerName}</span>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.color}`}>
          {exchange.status}
        </span>
      </div>

      {/* Trade-in → Desired */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-400 font-medium mb-0.5">TRADE-IN</p>
          <p className="text-xs font-semibold text-gray-800 leading-tight">
            {exchange.tradeInBrand} {exchange.tradeInModel}
          </p>
          <p className="text-[10px] text-gray-500">{exchange.tradeInStorage} · {exchange.tradeInCondition}</p>
        </div>
        <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
        <div className="flex-1 bg-blue-50 rounded-xl p-2.5">
          <p className="text-[10px] text-blue-400 font-medium mb-0.5">WANTS</p>
          <p className="text-xs font-semibold text-blue-800 leading-tight">
            {exchange.desiredPhone
              ? `${exchange.desiredPhone.brand} ${exchange.desiredPhone.model}`
              : 'Unknown Phone'}
          </p>
          {exchange.desiredPhone?.storage && (
            <p className="text-[10px] text-blue-500">{exchange.desiredPhone.storage}</p>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-gray-400">Trade-in Value</p>
            <p className="text-xs font-semibold text-gray-700">{formatETB(exchange.finalTradeInValue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Customer Pays</p>
            <p className="text-xs font-bold text-blue-600">{formatETB(exchange.finalDifference)}</p>
          </div>
        </div>
        <span className="text-[11px] text-gray-400">{formatRelativeTime(exchange.createdAt)}</span>
      </div>

      {/* Budget flag */}
      {exchange.budgetMentionedInSubmission && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
            💬 Budget mentioned
          </span>
        </div>
      )}
    </button>
  );
}
