import PageHeader from '../components/PageHeader';

export default function SettingsAccess() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Access Control" subtitle="Admin whitelist" showBack />

      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-700">Coming soon: manage admin IDs</p>
        </div>
      </div>
    </div>
  );
}
