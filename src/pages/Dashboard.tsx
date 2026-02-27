import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  MessageCircle,
  Inbox,
  AlertTriangle,
  Package,
  CheckCircle2,
  Send,
  UserCheck,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats, getRecentActivity } from '../lib/api';
import { getTelegramUser } from '../lib/telegram';
import { formatRelativeTime } from '../lib/utils';
import type { DashboardStats, RecentActivity, ActivityType } from '../types';

const activityIcons: Record<ActivityType, { icon: typeof Package; color: string; bg: string }> = {
  exchange_submitted: { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50' },
  exchange_quoted: { icon: Send, color: 'text-purple-600', bg: 'bg-purple-50' },
  exchange_accepted: { icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  exchange_completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  exchange_rejected: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  message_sent: { icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  stock_changed: { icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
  thread_closed: { icon: Inbox, color: 'text-gray-600', bg: 'bg-gray-50' },
  product_added: { icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
  product_archived: { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getTelegramUser();

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentActivity()]).then(([s, a]) => {
      setStats(s);
      setActivity(a);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
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
        {/* Stats Grid */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Today's Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="New Exchanges"
              value={stats?.newExchangesToday ?? 0}
              icon={<ArrowLeftRight size={20} className="text-blue-600" />}
              iconBg="bg-blue-50"
              onClick={() => navigate('/exchanges')}
              badge={stats?.newExchangesToday ? 'NEW' : undefined}
            />
            <StatCard
              title="New Messages"
              value={stats?.newMessagesToday ?? 0}
              icon={<MessageCircle size={20} className="text-purple-600" />}
              iconBg="bg-purple-50"
              onClick={() => navigate('/inbox')}
            />
            <StatCard
              title="Open Threads"
              value={stats?.openThreads ?? 0}
              icon={<Inbox size={20} className="text-amber-600" />}
              iconBg="bg-amber-50"
              onClick={() => navigate('/inbox')}
            />
            <StatCard
              title="Low Stock"
              value={stats?.lowStockCount ?? 0}
              icon={<AlertTriangle size={20} className="text-red-500" />}
              iconBg="bg-red-50"
              onClick={() => navigate('/inventory?filter=lowstock')}
              badge={stats?.lowStockCount ? '!' : undefined}
              badgeColor="bg-red-500"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/inventory/add?type=phone')}
              className="bg-blue-600 text-white rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform shadow-sm"
            >
              <Package size={20} />
              <span className="text-sm font-semibold">Add Phone</span>
            </button>
            <button
              onClick={() => navigate('/inbox')}
              className="bg-white text-gray-800 rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform shadow-sm border border-gray-100"
            >
              <Inbox size={20} className="text-blue-600" />
              <span className="text-sm font-semibold">View Inbox</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {activity.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No recent activity</p>
            ) : (
              activity.map((item, idx) => {
                const { icon: Icon, color, bg } = activityIcons[item.type];
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-default ${
                      idx < activity.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                      <Icon size={16} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
