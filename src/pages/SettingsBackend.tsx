import PageHeader from '../components/PageHeader';
import { getBackendInfo } from '../lib/backend';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'http://localhost:8400';

export default function SettingsBackend() {
  const backendInfo = getBackendInfo(CONVEX_URL);
  const backendLabel = backendInfo.label ?? 'Unavailable';
  const isDev = backendInfo.environment === 'DEV';

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Backend Status" subtitle={backendInfo.status} showBack />

      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Environment</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{backendInfo.environment}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Hostname</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{backendLabel}</p>
          </div>
          {isDev && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-yellow-800">⚠ DEV backend — do not run PROD migrations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
