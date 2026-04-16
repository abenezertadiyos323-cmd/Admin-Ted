import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { 
  ChevronLeft, 
  ArrowRightLeft, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
  Target,
  DollarSign
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTelegramUser } from '../lib/telegram';

export default function ExchangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const admin = getTelegramUser();
  const [quoteValue, setQuoteValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exchange = useQuery(api.exchanges.getExchangeById, {
    exchangeId: id as Id<'exchanges'>,
  });

  const sendQuote = useMutation(api.exchanges.sendAdminQuote);
  const rejectExchange = useMutation(api.exchanges.rejectExchange);
  const completeExchange = useMutation(api.exchanges.completeExchange);

  const handleSendQuote = async () => {
    if (!id || !quoteValue) return;
    setIsSubmitting(true);
    try {
      await sendQuote({
        exchangeId: id as Id<'exchanges'>,
        tradeInValue: parseFloat(quoteValue),
        adminName: admin.first_name,
      });
      // Optionally show success or navigate
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (exchange === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!exchange) return null;

  const tradeInModel = `${exchange.tradeInBrand} ${exchange.tradeInModel}`;
  const status = exchange.status;

  return (
    <div className="min-h-screen bg-bg pb-12">
      {/* Header */}
      <header className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exchanges')} className="p-1 -ml-2 text-muted active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-sm font-bold">Exchange Details</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border">
          <CircleIcon status={status} />
          <span className="text-[10px] font-black uppercase tracking-wider text-muted">{status}</span>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Customer Info Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center border border-border">
            <User size={20} className="text-muted" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Customer Information</p>
            <p className="text-sm font-bold">UID: {exchange.telegramId}</p>
          </div>
          <button 
            onClick={() => navigate(`/inbox/${exchange.threadId}`)}
            className="ml-auto p-2 bg-primary/10 text-primary rounded-xl active:scale-90 transition-transform"
          >
            <MessageSquare size={18} />
          </button>
        </div>

        {/* Trade-In Specs */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <ArrowRightLeft size={14} /> Trade-In Device
          </h2>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-border/50">
              <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-primary border border-border">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold">{tradeInModel}</h3>
                <p className="text-xs text-muted font-semibold mt-0.5">
                  {exchange.tradeInStorage} · {exchange.tradeInCondition}
                </p>
              </div>
            </div>
            {exchange.tradeInImei && (
              <div className="px-4 py-3 bg-surface-2/50 flex justify-between items-center text-xs">
                <span className="text-muted">IMEI/Serial</span>
                <span className="font-mono font-bold">{exchange.tradeInImei}</span>
              </div>
            )}
            <div className="p-4">
              <p className="text-xs font-bold text-muted uppercase mb-2">Customer Notes</p>
              <p className="text-sm bg-surface-2 p-3 rounded-xl border border-border italic">
                &quot;{exchange.customerNotes || "No notes provided"}&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Desired Product */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <Target size={14} /> Desired Product
          </h2>
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold">iPhone 15 Pro</h3>
                <p className="text-xs text-muted">128GB · New</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Current Price</p>
              <p className="text-sm font-bold">85,000 ETB</p>
            </div>
          </div>
        </section>

        {/* Pricing Logic / Quote */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <DollarSign size={14} /> Quoting
          </h2>
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Estimated Trade-in</span>
              <span className="text-sm font-bold">{exchange.calculatedTradeInValue.toLocaleString()} ETB</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <span className="text-sm text-muted">Estimated Difference</span>
              <span className="text-sm font-bold text-primary">{exchange.calculatedDifference.toLocaleString()} ETB</span>
            </div>

            {status === 'Pending' && (
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold text-muted uppercase">Set Admin Trade-In Value</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={quoteValue}
                    onChange={(e) => setQuoteValue(e.target.value)}
                    placeholder="Enter value in ETB"
                    className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleSendQuote}
                    disabled={!quoteValue || isSubmitting}
                    className="px-6 bg-primary text-primary-fg rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {exchange.finalTradeInValue > 0 && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Final Trade-In</span>
                  <span className="font-bold">{exchange.finalTradeInValue.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="font-bold">Final Difference</span>
                  <span className="font-black text-primary">{exchange.finalDifference.toLocaleString()} ETB</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="pt-4 flex gap-3">
          <button 
            disabled 
            className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border opacity-50"
          >
            <XCircle size={20} className="mb-1 text-red-500" />
            <span className="text-[10px] font-bold uppercase">Reject</span>
          </button>
          <button 
            disabled
            className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border opacity-50"
          >
            <CheckCircle2 size={20} className="mb-1 text-green-500" />
            <span className="text-[10px] font-bold uppercase">Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CircleIcon({ status }: { status: string }) {
  const color = status === 'Pending' ? 'var(--primary)' : status === 'Quoted' ? '#3B82F6' : '#10B981';
  return <div className="w-2 h-2 rounded-full" style={{ background: color }} />;
}

import { Smartphone } from 'lucide-react';
