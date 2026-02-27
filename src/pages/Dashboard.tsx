import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Settings as SettingsIcon, X } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTelegramUser } from '../lib/telegram';

// ── Helpers ────────────────────────────────────────────────────────────────

function deltaSign(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function replyDot(minutes: number): string {
  if (minutes <= 10) return '🟢';
  if (minutes <= 30) return '🟡';
  return '🔴';
}

// ── Broadcast Modal (MVP placeholder) ─────────────────────────────────────

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">📢 Broadcast Promo</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <select className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 bg-white">
          <option value="">Select template…</option>
          <option value="iphone">📱 iPhone deals this week</option>
          <option value="arrivals">🆕 New arrivals</option>
          <option value="promo">🎉 Special promo</option>
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here…"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm h-28 resize-none text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          disabled={!message.trim()}
          className="w-full bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
        >
          Send Broadcast
        </button>
        <p className="text-[11px] text-gray-400 text-center">
          Send functionality coming soon
        </p>
      </div>
    </div>
  );
}

// ── Alert row ──────────────────────────────────────────────────────────────

function AlertItem({
  emoji,
  text,
  onClick,
}: {
  emoji: string;
  text: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-start gap-3 px-4 py-3 w-full text-left active:bg-gray-50 transition-colors"
      >
        <span className="text-base flex-shrink-0 mt-0.5">{emoji}</span>
        <p className="text-sm text-gray-700 leading-snug">{text}</p>
      </button>
    );
  }
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-base flex-shrink-0 mt-0.5">{emoji}</span>
      <p className="text-sm text-gray-700 leading-snug">{text}</p>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getTelegramUser();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const metrics = useQuery(api.dashboard.getHomeMetrics);

  if (metrics === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ── KPI values ─────────────────────────────────────────────────────────

  // A — Replies Waiting
  const kpiA_delta = metrics.repliesWaiting15m - metrics.repliesWaiting15mYesterday;
  const kpiA_comparison = `${deltaSign(kpiA_delta)} vs yesterday`;
  const kpiA_compColor =
    metrics.repliesWaiting15m === 0
      ? 'text-green-600'
      : kpiA_delta < 0
      ? 'text-green-600'  // fewer waiting than yesterday = improvement
      : kpiA_delta > 0
      ? 'text-red-500'    // more waiting than yesterday = worse
      : 'text-amber-500'; // same as yesterday, still has waiting

  // B — First-Time Today
  const kpiB_pct =
    metrics.firstTimeYesterday > 0
      ? Math.round(
          ((metrics.firstTimeToday - metrics.firstTimeYesterday) /
            metrics.firstTimeYesterday) *
            100
        )
      : null;
  const kpiB_comparison =
    kpiB_pct != null
      ? `${deltaSign(kpiB_pct)}% vs yesterday`
      : `${metrics.firstTimeToday} total`;
  const kpiB_compColor =
    kpiB_pct != null && kpiB_pct > 0 ? 'text-green-600' : 'text-gray-400';

  // C — Median Reply Time
  const kpiC_value =
    metrics.medianReplyToday > 0 ? `${metrics.medianReplyToday} min` : '—';
  const kpiC_dot =
    metrics.medianReplyToday > 0 ? replyDot(metrics.medianReplyToday) : '';
  const kpiC_delta = metrics.medianReplyToday - metrics.medianReplyYesterday;
  const kpiC_comparison =
    metrics.medianReplyToday > 0 && metrics.medianReplyYesterday > 0
      ? kpiC_delta === 0
        ? `Same as yesterday · ${kpiC_dot}`
        : `${Math.abs(kpiC_delta)} min ${kpiC_delta < 0 ? 'faster' : 'slower'} · ${kpiC_dot}`
      : metrics.medianReplyToday > 0
      ? `${kpiC_dot} today`
      : 'No data yet';
  const kpiC_compColor =
    kpiC_delta < 0 ? 'text-green-600'       // faster = good
    : kpiC_delta === 0 ? 'text-gray-400'    // same = neutral
    : kpiC_delta <= 10 ? 'text-amber-500'   // slightly slower
    : 'text-red-500';                        // much slower

  // D — Phones Sold
  const kpiD_delta = metrics.phonesSoldToday - metrics.phonesSoldYesterday;
  const kpiD_comparison = `${deltaSign(kpiD_delta)} vs yesterday`;
  const kpiD_compColor = kpiD_delta >= 0 ? 'text-green-600' : 'text-red-500';

  // ── Alerts ────────────────────────────────────────────────────────────

  const { alerts } = metrics;
  const activeAlerts: { emoji: string; text: string; to?: string }[] = [];

  if (alerts.waiting30m > 0) {
    activeAlerts.push({
      emoji: '⏳',
      text: `${alerts.waiting30m} thread${alerts.waiting30m > 1 ? 's' : ''} waiting over 30 min`,
      to: '/inbox?filter=waiting30',
    });
  }
  if (alerts.lowStock > 0) {
    activeAlerts.push({
      emoji: '📦',
      text: `${alerts.lowStock} item${alerts.lowStock > 1 ? 's' : ''} low on stock`,
      to: '/inventory?filter=lowstock',
    });
  }
  if (alerts.replySlowRatio != null && alerts.replySlowRatio > 1.3) {
    activeAlerts.push({
      emoji: '🐢',
      text: `Reply speed ${alerts.replySlowRatio.toFixed(1)}× slower than yesterday`,
      to: '/inbox',
    });
  }
  if (alerts.unansweredToday > 0) {
    activeAlerts.push({
      emoji: '🔕',
      text: `${alerts.unansweredToday} thread${alerts.unansweredToday > 1 ? 's' : ''} unanswered today`,
      to: '/inbox?filter=unanswered',
    });
  }
  if (alerts.quotes48h > 0) {
    activeAlerts.push({
      emoji: '💰',
      text: `${alerts.quotes48h} quote${alerts.quotes48h > 1 ? 's' : ''} open for over 48 hours`,
      to: '/exchanges?filter=quoted',
    });
  }
  if (
    alerts.newCustomerPct != null &&
    alerts.newCustomerPct > 50 &&
    alerts.newCustomerDelta >= 5
  ) {
    activeAlerts.push({
      emoji: '🆕',
      text: `${alerts.newCustomerToday} new customers today (+${alerts.newCustomerPct}%)`,
      to: '/inbox?filter=firstContact',
    });
  }

  const PREVIEW = 4;
  const visibleAlerts = showAllAlerts ? activeAlerts : activeAlerts.slice(0, PREVIEW);
  const hasMore = activeAlerts.length > PREVIEW && !showAllAlerts;
  const followUpDisabled = metrics.followUpPending === 0;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white px-4 pt-4 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Good day,</p>
              <h1 className="text-xl font-bold text-gray-900">{user.first_name} 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Open settings"
                onClick={() => navigate('/settings')}
                className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
              >
                <SettingsIcon size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user.first_name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* KPI Grid */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Today's Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                title="Replies Waiting"
                value={metrics.repliesWaiting15m}
                comparison={kpiA_comparison}
                comparisonColor={kpiA_compColor}
                onClick={() => navigate('/inbox?filter=waiting30')}
              />
              <KpiCard
                title="First-Time Today"
                value={metrics.firstTimeToday}
                comparison={kpiB_comparison}
                comparisonColor={kpiB_compColor}
                onClick={() => navigate('/inbox?filter=firstContact')}
              />
              <KpiCard
                title="Median Reply Time"
                value={kpiC_value}
                comparison={kpiC_comparison}
                comparisonColor={kpiC_compColor}
                onClick={() => navigate('/inbox')}
              />
              <KpiCard
                title="Phones Sold"
                value={metrics.phonesSoldToday}
                comparison={kpiD_comparison}
                comparisonColor={kpiD_compColor}
                onClick={() => navigate('/exchanges')}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowBroadcast(true)}
                className="bg-blue-600 text-white rounded-2xl p-4 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
              >
                <span className="text-lg leading-none">📢</span>
                <span className="text-sm font-semibold leading-snug">Broadcast Promo</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  !followUpDisabled && navigate('/inbox?filter=followUp')
                }
                disabled={followUpDisabled}
                className={`rounded-2xl p-4 flex items-center gap-2 transition-transform shadow-sm border ${
                  followUpDisabled
                    ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-100 text-gray-800 active:scale-95'
                }`}
              >
                <span className="text-lg leading-none">💬</span>
                <span className="text-sm font-semibold leading-snug">
                  Follow Up ·{' '}
                  {metrics.followUpPending > 0
                    ? `${metrics.followUpPending} pending`
                    : '0 pending'}
                </span>
              </button>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Alerts
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {activeAlerts.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">
                  ✅ Nothing needs attention
                </p>
              ) : (
                <>
                  {visibleAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={
                        idx < visibleAlerts.length - 1 || hasMore
                          ? 'border-b border-gray-50'
                          : ''
                      }
                    >
                      <AlertItem
                        emoji={alert.emoji}
                        text={alert.text}
                        onClick={alert.to ? () => navigate(alert.to!) : undefined}
                      />
                    </div>
                  ))}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setShowAllAlerts(true)}
                      className="w-full py-3 text-xs font-medium text-blue-600 text-center active:bg-gray-50 transition-colors"
                    >
                      Show {activeAlerts.length - PREVIEW} more
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
    </>
  );
}
