import { ChevronRight, User, Bell, Database, Info, Shield } from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';

const SETTINGS_ITEMS = [
  {
    section: 'Account',
    items: [
      { icon: User, label: 'Admin Profile', description: 'View your admin account details' },
      { icon: Shield, label: 'Access Control', description: 'Manage admin whitelist' },
    ],
  },
  {
    section: 'Notifications',
    items: [
      { icon: Bell, label: 'Push Notifications', description: 'Configure alert preferences' },
    ],
  },
  {
    section: 'Data',
    items: [
      { icon: Database, label: 'Convex Backend', description: 'Database connection status' },
    ],
  },
  {
    section: 'About',
    items: [
      { icon: Info, label: 'App Version', description: 'TedyTech Admin v1.0.0 (MVP)' },
    ],
  },
];

export default function Settings() {
  const user = getTelegramUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-4">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Admin Profile Card */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {user.first_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">
              {user.first_name} {user.last_name ?? ''}
            </p>
            {user.username && (
              <p className="text-sm text-gray-500">@{user.username}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600 font-medium">Active Admin</span>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {SETTINGS_ITEMS.map((section) => (
            <div key={section.section}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
                {section.section}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors ${
                        idx < section.items.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={17} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 truncate">{item.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Backend Note */}
        <div className="mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-1">Backend Integration</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            This app is currently running with mock data. Connect to Convex backend to enable real-time data, 
            Telegram bot integration, and live inventory management.
          </p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6 mb-4">
          TedyTech Admin · MVP Build · PO Box 014
        </p>
      </div>
    </div>
  );
}
