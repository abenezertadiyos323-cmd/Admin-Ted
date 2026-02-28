import PageHeader from '../components/PageHeader';

export default function SettingsAccess() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Access Control" subtitle="Admin whitelist" showBack backTo="/settings" />

      <div className="px-4 py-4">
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-4">
          <p className="text-sm text-app-text">Coming soon: manage admin IDs</p>
        </div>
      </div>
    </div>
  );
}
