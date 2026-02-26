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
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Settings" />

      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('/settings/access')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Access Control</p>
              <p className="text-xs text-gray-400 truncate">Admin whitelist</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings/backend')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Backend Status</p>
              <p className="text-xs text-gray-400 truncate">{backendSubtitle}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>

          <div className="px-4 py-3.5 border-b border-gray-50 cursor-default">
            <p className="text-sm font-medium text-gray-800">App Version</p>
            <p className="text-xs text-gray-400 truncate">{APP_VERSION}</p>
          </div>

          <div className="px-4 py-3.5 cursor-default">
            <p className="text-sm font-medium text-gray-800">Admin Profile</p>
            <p className="text-xs text-gray-400 truncate">{adminLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
