import PageHeader from '../components/PageHeader';
import { getBackendInfo } from '../lib/backend';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'http://localhost:8400';

export default function SettingsBackend() {
  const backendInfo = getBackendInfo(CONVEX_URL);
  const backendLabel = backendInfo.label ?? 'Unavailable';
  const isDev = backendInfo.environment === 'DEV';

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Backend Status" subtitle={backendInfo.status} showBack backTo="/settings" />

      <div className="px-4 py-4">
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Environment</p>
              <p className="text-sm font-medium text-app-text mt-1">{backendInfo.environment}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Hostname</p>
            <p className="text-sm font-medium text-app-text mt-1">{backendLabel}</p>
          </div>
          {isDev && (
            <div className="bg-yellow-950/40 border border-yellow-500/40 rounded-lg p-3 mt-2">
              <p className="text-xs text-yellow-400">⚠ DEV backend — do not run PROD migrations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
