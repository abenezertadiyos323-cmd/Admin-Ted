import PageHeader from '../components/PageHeader';
import { getBackendInfo } from '../lib/backend';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'http://localhost:8400';

export default function SettingsBackend() {
  const backendInfo = getBackendInfo(CONVEX_URL);
  const backendLabel = backendInfo.label ?? 'Unavailable';
  const backendHostname = backendInfo.hostname ?? 'Unavailable';

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Backend Status" subtitle={backendInfo.status} showBack />

      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Label</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{backendLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Hostname</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{backendHostname}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
