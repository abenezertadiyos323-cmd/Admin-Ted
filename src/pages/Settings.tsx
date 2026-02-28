import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getTelegramUser } from '../lib/telegram';
import { getBackendInfo } from '../lib/backend';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'http://localhost:8400';
const APP_VERSION = import.meta.env.VITE_APP_VERSION
  ? `v${import.meta.env.VITE_APP_VERSION}`
  : 'v1.0.0';

export default function Settings() {
  const navigate = useNavigate();
  const user = getTelegramUser();
  const backendInfo = getBackendInfo(CONVEX_URL);
  const backendSubtitle = backendInfo.label
    ? `${backendInfo.environment} - ${backendInfo.label}`
    : backendInfo.environment;

  const adminLabel = user.username
    ? `@${user.username} (ID: ${user.id})`
    : `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''} (ID: ${user.id})`;

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Settings" />

      <div className="px-4 py-4">
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('/settings/access')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors border-b border-[var(--border)]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-app-text">Access Control</p>
              <p className="text-xs text-muted truncate">Admin whitelist</p>
            </div>
            <ChevronRight size={16} className="text-muted flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings/backend')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors border-b border-[var(--border)]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-app-text">Backend Status</p>
              <p className="text-xs text-muted truncate">{backendSubtitle}</p>
            </div>
            <ChevronRight size={16} className="text-muted flex-shrink-0" />
          </button>

          <div className="px-4 py-3.5 border-b border-[var(--border)] cursor-default">
            <p className="text-sm font-medium text-app-text">App Version</p>
            <p className="text-xs text-muted truncate">{APP_VERSION}</p>
          </div>

          <div className="px-4 py-3.5 cursor-default">
            <p className="text-sm font-medium text-app-text">Admin Profile</p>
            <p className="text-xs text-muted truncate">{adminLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
