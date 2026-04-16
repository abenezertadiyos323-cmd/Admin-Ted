import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  ChevronRight, 
  Shield, 
  Database, 
  Bell, 
  Globe, 
  Check,
  Smartphone,
  Info,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const navigate = useNavigate();
  const settings = useQuery(api.adminSettings.getSettings);

  const sections = [
    {
      title: 'Management',
      items: [
        { 
          id: 'access', 
          label: 'Admin Access', 
          icon: <Shield size={18} />, 
          description: 'Manage authorized Telegram IDs',
          to: '/settings/access' 
        },
        { 
          id: 'backend', 
          label: 'Backend Status', 
          icon: <Database size={18} />, 
          description: 'System health and variables',
          to: '/settings/backend' 
        },
      ]
    },
    {
      title: 'Store Defaults',
      items: [
        { 
          id: 'store', 
          label: 'Store Profile', 
          icon: <Globe size={18} />, 
          description: 'Working hours, contact, and address',
          to: null 
        },
        { 
          id: 'notifications', 
          label: 'Alert Rules', 
          icon: <Bell size={18} />, 
          description: 'Low stock and inbox reminders',
          to: null 
        },
      ]
    }
  ];

  if (settings === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Settings" backTo="/" />

      <div className="p-4 space-y-6">
        {/* App Info Card */}
        <div className="p-5 bg-surface border border-border rounded-3xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-1">TedyTech Admin</h2>
            <p className="text-xl font-bold">V2.4.0 Production</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Synchronized with Micky Mobile Core logic. 
              Variant-pricing and lead tracking enabled.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Smartphone size={120} />
          </div>
        </div>

        {/* Setting Groups */}
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-1 text-[10px] font-black uppercase tracking-widest text-muted/60">{section.title}</h3>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.id}
                  disabled={!item.to}
                  onClick={() => item.to && navigate(item.to)}
                  className={`w-full flex items-center justify-between p-4 text-left active:bg-surface-2 transition-colors ${!item.to && 'opacity-40'}`}
                  style={idx < section.items.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-primary border border-border">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-[10px] text-muted font-medium">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-border" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Support Link */}
        <div className="pt-4">
          <button className="w-full p-4 rounded-2xl bg-surface-2 border border-border flex items-center justify-center gap-2 text-xs font-bold text-muted">
            <Info size={16} /> Technical Documentation
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
