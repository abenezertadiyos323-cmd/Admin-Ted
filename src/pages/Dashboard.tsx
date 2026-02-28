import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Settings as SettingsIcon, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTelegramUser } from '../lib/telegram';

// ── Multi-value card (Today / 7d / 30d) ───────────────────────────────────

function MultiValueCard({
  title,
  today,
  week7,
  month30,
}: {
  title: string;
  today: number;
  week7: number;
  month30: number;
}) {
  const segments: [string, number][] = [
    ['Today', today],
    ['7d', week7],
    ['30d', month30],
  ];
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
      <p className="text-xs text-gray-500 font-medium mb-3">{title}</p>
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {segments.map(([label, val]) => (
          <div key={label} className="text-center px-2 first:pl-0 last:pr-0">
            <p className="text-2xl font-bold text-gray-900 leading-none">{val}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top 3 Phone Types card ─────────────────────────────────────────────────

function PhoneTypesCard({
  items,
}: {
  items: Array<{
    phoneType: string;
    totalSignals: number;
    botSignals: number;
    searchSignals: number;
    selectSignals: number;
  }>;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
      <p className="text-xs text-gray-500 font-medium mb-3">Top 3 Requested (7d)</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">No exchange data yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.phoneType} className="flex items-start gap-2">
              <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0 mt-0.5 tabular-nums">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.phoneType}</p>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {item.totalSignals}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Bot: {item.botSignals} · Search: {item.searchSignals} · Sel:{' '}
                  {item.selectSignals}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Requested But Not Available section ───────────────────────────────────

function NotAvailableSection({
  items,
}: {
  items: Array<{ phoneType: string; totalSignals: number }>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Requested But Not Available (7d)
      </h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {items.map((item, idx) => (
          <div
            key={item.phoneType}
            className={`flex items-center justify-between px-4 py-3 ${
              idx < items.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⛔</span>
              <p className="text-sm font-medium text-gray-800">{item.phoneType}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-700">{item.totalSignals}</span>
              <span className="text-xs text-red-500 font-medium">not available</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Restock Suggestions Modal ──────────────────────────────────────────────

function RestockModal({
  data,
  onClose,
}: {
  data: Array<{ phoneType: string; totalSignals: number; availableStock: number }>;
  onClose: () => void;
}) {
  const suggestions = data.map((item) => ({
    ...item,
    reason:
      item.availableStock === 0 ? 'No stock' : `${item.availableStock} in stock`,
    tier:
      item.totalSignals >= 8
        ? 'High (5–10 units)'
        : item.totalSignals >= 4
        ? 'Medium (3–5 units)'
        : 'Low (1–3 units)',
  }));

  const reportText = suggestions
    .map(
      (s, i) =>
        `${i + 1}. ${s.phoneType}\n   ${s.totalSignals} requests · ${s.reason}\n   Suggested: ${s.tier}`,
    )
    .join('\n\n');

  function handleCopy() {
    navigator.clipboard
      .writeText(`📦 Restock Suggestions\n\n${reportText}`)
      .catch(() => undefined);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">📦 Restock Suggestions</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No demand signals in the last 7 days.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={s.phoneType} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400 tabular-nums">{i + 1}</span>
                  <p className="text-sm font-semibold text-gray-900">{s.phoneType}</p>
                </div>
                <p className="text-xs text-gray-600">
                  {s.totalSignals} requests · {s.reason}
                </p>
                <p className="text-xs font-semibold text-blue-600 mt-1">Suggested: {s.tier}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            disabled={suggestions.length === 0}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-3 font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Content Plan Modal ────────────────────────────────────────────────────

const GENERIC_TOPICS = [
  'Trading in your phone?',
  'Warranty & quality guarantee',
  'How we price phones',
  'Customer testimonials',
  'Fast delivery info',
  'Best deals this week',
  'Why buy from TedyTech',
];

function getHook(phoneType: string): string {
  const lower = phoneType.toLowerCase();
  if (lower.includes('iphone')) return `Is the ${phoneType} worth it in 2025? 👀`;
  if (lower.includes('samsung')) return `Why everyone wants the ${phoneType} right now 🔥`;
  if (lower.includes('deals') || lower.includes('best')) return `Best phone deals you can't miss 🔥`;
  if (lower.includes('warranty') || lower.includes('quality')) return `How we guarantee quality on every phone 🛡️`;
  if (lower.includes('trading') || lower.includes('trade')) return `Get cash for your old phone — here's how 💸`;
  if (lower.includes('delivery')) return `Order today, get it tomorrow ⚡`;
  return `${phoneType} — here's what our customers keep asking about 📱`;
}

function ContentPlanModal({
  topPhoneTypes,
  availableStock,
  onClose,
}: {
  topPhoneTypes: Array<{ phoneType: string; totalSignals: number }>;
  availableStock: Array<{ phoneType: string; stock: number; price: number }>;
  onClose: () => void;
}) {
  const stockMap = new Map(availableStock.map((s) => [s.phoneType, s]));

  const seen = new Set<string>();
  const topics: Array<{ phoneType: string; price: number | null; inStock: boolean }> = [];

  // Fill from top demanded phones first
  for (const pt of topPhoneTypes) {
    if (seen.has(pt.phoneType)) continue;
    seen.add(pt.phoneType);
    const s = stockMap.get(pt.phoneType);
    topics.push({
      phoneType: pt.phoneType,
      price: s?.price ?? null,
      inStock: s != null && s.stock > 0,
    });
  }

  // Then fill from available inventory
  for (const s of availableStock) {
    if (topics.length >= 7) break;
    if (seen.has(s.phoneType)) continue;
    seen.add(s.phoneType);
    topics.push({ phoneType: s.phoneType, price: s.price, inStock: true });
  }

  // Pad remaining days with generic content topics
  while (topics.length < 7) {
    const genericTopic = GENERIC_TOPICS[topics.length % GENERIC_TOPICS.length];
    topics.push({ phoneType: genericTopic, price: null, inStock: false });
  }

  const planLines = topics.slice(0, 7).map((d, i) => {
    const mentionParts: string[] = [];
    if (d.price != null) mentionParts.push(`From ${d.price.toLocaleString()} ETB`);
    mentionParts.push(d.inStock ? 'In stock NOW' : 'Coming soon');
    mentionParts.push('Fast delivery · Warranty');
    return {
      day: i + 1,
      topic: d.phoneType,
      hook: getHook(d.phoneType),
      mention: mentionParts.join(' · '),
      cta: 'DM on Telegram / Open mini app',
    };
  });

  const planText = planLines
    .map(
      (p) =>
        `Day ${p.day} — ${p.topic}\nHook: "${p.hook}"\nMention: ${p.mention}\nCTA: ${p.cta}`,
    )
    .join('\n\n');

  function handleCopy() {
    navigator.clipboard
      .writeText(`📅 7-Day TikTok Plan\n\n${planText}`)
      .catch(() => undefined);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">📅 Content Plan (7 days)</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="space-y-3">
          {planLines.map((p) => (
            <div key={p.day} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-600 mb-2">
                Day {p.day} — {p.topic}
              </p>
              <p className="text-xs text-gray-700">
                <span className="font-medium">Hook:</span> &quot;{p.hook}&quot;
              </p>
              <p className="text-xs text-gray-700 mt-1">
                <span className="font-medium">Mention:</span> {p.mention}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">CTA:</span> {p.cta}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Close
          </button>
        </div>
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
  const [showRestock, setShowRestock] = useState(false);
  const [showContentPlan, setShowContentPlan] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const metrics = useQuery(api.dashboard.getHomeMetrics);
  const demand = useQuery(api.dashboard.getDemandMetrics);

  if (metrics === undefined || demand === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

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
          {/* Demand Overview */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Demand Overview
            </h2>
            <div className="space-y-3">
              <MultiValueCard
                title="Total Conversations"
                today={demand.totalConversations.today}
                week7={demand.totalConversations.week7}
                month30={demand.totalConversations.month30}
              />
              <MultiValueCard
                title="First-Time Conversations"
                today={demand.firstTimeConversations.today}
                week7={demand.firstTimeConversations.week7}
                month30={demand.firstTimeConversations.month30}
              />
              <PhoneTypesCard items={demand.topPhoneTypes} />
            </div>
          </div>

          {/* Requested But Not Available insight */}
          <NotAvailableSection items={demand.notAvailable} />

          {/* Quick Actions */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowRestock(true)}
                className="bg-blue-600 text-white rounded-2xl p-4 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
              >
                <span className="text-lg leading-none">📦</span>
                <span className="text-sm font-semibold leading-snug">Restock Suggestions</span>
              </button>
              <button
                type="button"
                onClick={() => setShowContentPlan(true)}
                className="bg-white border border-gray-100 text-gray-800 rounded-2xl p-4 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
              >
                <span className="text-lg leading-none">📅</span>
                <span className="text-sm font-semibold leading-snug">Content Plan (7d)</span>
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

      {showRestock && (
        <RestockModal data={demand.restockData} onClose={() => setShowRestock(false)} />
      )}
      {showContentPlan && (
        <ContentPlanModal
          topPhoneTypes={demand.topPhoneTypes}
          availableStock={demand.availableStock}
          onClose={() => setShowContentPlan(false)}
        />
      )}
    </>
  );
}
