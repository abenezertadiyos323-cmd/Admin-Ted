import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Send, CheckCircle, XCircle, MessageCircle, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getExchangeById, updateExchangeStatus, sendQuote } from '../lib/api';
import { getTelegramUser } from '../lib/telegram';
import {
  formatETB,
  formatRelativeTime,
  getExchangeStatusColor,
  getCustomerName,
  buildQuoteMessage,
} from '../lib/utils';
import type { Exchange } from '../types';

export default function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const user = getTelegramUser();

  useEffect(() => {
    if (!id) return;
    getExchangeById(id).then((ex) => {
      setExchange(ex);
      if (ex) {
        setQuoteText(
          buildQuoteMessage({
            tradeInModel: `${ex.tradeInBrand} ${ex.tradeInModel}`,
            tradeInValue: ex.finalTradeInValue,
            desiredPhoneModel: ex.desiredPhone
              ? ex.desiredPhone.phoneType
              : 'Desired Phone',
            desiredPhonePrice: ex.desiredPhonePrice,
            difference: ex.finalDifference,
          })
        );
      }
      setLoading(false);
    });
  }, [id]);

  const handleAction = async (action: 'accept' | 'complete' | 'reject') => {
    if (!id || !exchange) return;
    setActionLoading(true);
    const statusMap = { accept: 'Accepted', complete: 'Completed', reject: 'Rejected' } as const;
    const updated = await updateExchangeStatus(id, statusMap[action], String(user.id));
    setExchange(updated);
    setActionLoading(false);
  };

  const handleSendQuote = async () => {
    if (!id || !quoteText.trim()) return;
    setActionLoading(true);
    const { exchange: updated } = await sendQuote(id, quoteText, String(user.id));
    setExchange(updated);
    setShowQuoteModal(false);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-gray-500">Exchange not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm">Go back</button>
      </div>
    );
  }

  const statusStyle = getExchangeStatusColor(exchange.status);
  const customerName = exchange.thread
    ? getCustomerName(exchange.thread.customerFirstName, exchange.thread.customerLastName)
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 flex items-center gap-3 px-3 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Exchange Request</h1>
          <p className="text-xs text-gray-400">{formatRelativeTime(exchange.createdAt)}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.color}`}>
          {exchange.status}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{customerName}</p>
              {exchange.thread?.customerUsername ? (
                <p className="text-xs text-gray-400">@{exchange.thread.customerUsername}</p>
              ) : (
                <p className="text-xs text-gray-400">No username</p>
              )}
              <p className="text-xs text-gray-400">ID: {exchange.telegramId}</p>
            </div>
          </div>
        </div>

        {/* Trade-in Details */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Trade-In Phone</p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <div>
              <p className="text-[10px] text-gray-400">Brand</p>
              <p className="text-sm font-semibold text-gray-800">{exchange.tradeInBrand}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Model</p>
              <p className="text-sm font-semibold text-gray-800">{exchange.tradeInModel}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Storage</p>
              <p className="text-sm font-semibold text-gray-800">{exchange.tradeInStorage}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">RAM</p>
              <p className="text-sm font-semibold text-gray-800">{exchange.tradeInRam}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Condition</p>
              <p className="text-sm font-semibold text-gray-800">{exchange.tradeInCondition}</p>
            </div>
            {exchange.tradeInImei && (
              <div>
                <p className="text-[10px] text-gray-400">IMEI</p>
                <p className="text-xs font-mono text-gray-600">{exchange.tradeInImei}</p>
              </div>
            )}
          </div>
        </div>

        {/* Desired Phone */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Desired Phone</p>
          {exchange.desiredPhone ? (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {exchange.desiredPhone.images[0] ? (
                  <img
                    src={exchange.desiredPhone.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {exchange.desiredPhone.phoneType}
                </p>
                {exchange.desiredPhone.storage && (
                  <p className="text-xs text-gray-500">{exchange.desiredPhone.storage}</p>
                )}
                <p className="text-sm font-bold text-blue-600 mt-0.5">
                  {formatETB(exchange.desiredPhonePrice)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Phone not found</p>
          )}
        </div>

        {/* Price Calculation */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Price Breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Desired Phone Price</span>
              <span className="text-sm font-semibold text-gray-800">{formatETB(exchange.desiredPhonePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trade-in Value</span>
              <span className="text-sm font-semibold text-green-600">− {formatETB(exchange.finalTradeInValue)}</span>
            </div>
            <div className="h-px bg-gray-100 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">Customer Pays</span>
              <span className="text-base font-bold text-blue-600">{formatETB(exchange.finalDifference)}</span>
            </div>
          </div>
          {(exchange.adminOverrideTradeInValue || exchange.adminOverrideDifference) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] text-amber-600 font-medium">Admin override applied</p>
              <p className="text-[11px] text-gray-400">
                Calculated: {formatETB(exchange.calculatedTradeInValue)} trade-in / {formatETB(exchange.calculatedDifference)} difference
              </p>
            </div>
          )}
        </div>

        {/* Customer Notes */}
        {exchange.customerNotes && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Customer Notes</p>
            <p className="text-sm text-amber-800">{exchange.customerNotes}</p>
            {exchange.budgetMentionedInSubmission && (
              <span className="inline-block mt-2 text-[11px] text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                💬 Budget mentioned
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(exchange.status === 'Pending' || exchange.status === 'Quoted' || exchange.status === 'Accepted') && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            <div className="space-y-2">
              {exchange.status === 'Pending' && (
                <button
                  onClick={() => setShowQuoteModal(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Send size={16} />
                  Send Quote
                </button>
              )}
              {exchange.status === 'Quoted' && (
                <button
                  onClick={() => handleAction('accept')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Mark Accepted
                </button>
              )}
              {exchange.status === 'Accepted' && (
                <button
                  onClick={() => handleAction('complete')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Mark Completed
                </button>
              )}
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-500 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                <XCircle size={16} />
                Reject Exchange
              </button>
            </div>
          </div>
        )}

        {/* View Thread Button */}
        <button
          onClick={() => navigate(`/inbox/${exchange.threadId}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm active:scale-95 transition-transform shadow-sm"
        >
          <MessageCircle size={16} className="text-blue-600" />
          View Conversation
          <ArrowRight size={14} className="text-gray-400" />
        </button>

        {/* Finalized state */}
        {(exchange.status === 'Completed' || exchange.status === 'Rejected') && (
          <div className={`rounded-2xl p-4 border ${
            exchange.status === 'Completed'
              ? 'bg-green-50 border-green-100'
              : 'bg-red-50 border-red-100'
          }`}>
            <p className={`text-sm font-bold ${
              exchange.status === 'Completed' ? 'text-green-700' : 'text-red-700'
            }`}>
              {exchange.status === 'Completed' ? '✅ Exchange Completed' : '❌ Exchange Rejected'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {exchange.status === 'Completed'
                ? `Completed ${formatRelativeTime(exchange.completedAt!)}`
                : `Rejected ${formatRelativeTime(exchange.rejectedAt!)}`}
            </p>
          </div>
        )}
      </div>

      {/* Send Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="bg-white rounded-t-3xl w-full p-5 pb-8 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-base font-bold text-gray-900 mb-1">Send Quote</h2>
            <p className="text-xs text-gray-400 mb-3">Edit the message before sending. Exchange will be marked as Quoted.</p>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              rows={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuote}
                disabled={actionLoading || !quoteText.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {actionLoading ? 'Sending...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
