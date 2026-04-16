import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  Server, 
  Activity, 
  Globe, 
  Clock, 
  ChevronLeft,
  Terminal,
  ExternalLink,
  Cpu
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsBackend() {
  const settings = useQuery(api.adminSettings.getSettings);

  const stats = [
    { label: 'Environment', value: import.meta.env.MODE === 'production' ? 'Production' : 'Development', icon: <Terminal size={14} /> },
    { label: 'Cloud Provider', value: 'Convex Cloud', icon: <Globe size={14} /> },
    { label: 'Schema Version', value: 'V2.LeadGen', icon: <Cpu size={14} /> },
    { label: 'Storage Engine', value: 'Files v1', icon: <Server size={14} /> },
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
      <PageHeader title="Backend Status" backTo="/settings" />

      <div className="p-4 space-y-6">
        {/* Health Indicator */}
        <div className="p-6 bg-surface border border-border rounded-3xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 relative">
            <Activity size={32} className="text-green-500" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-4 border-surface rounded-full"></span>
          </div>
          <h2 className="text-lg font-bold">System Online</h2>
          <p className="text-xs text-muted mt-1">Backend services are responding normally.</p>
        </div>

        {/* System Details */}
        <div className="space-y-3">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-widest text-muted/60">System Attributes</h3>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {stats.map((stat, idx) => (
              <div 
                key={stat.label}
                className="flex items-center justify-between p-4"
                style={idx < stats.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}
              >
                <div className="flex items-center gap-2 text-muted">
                  {stat.icon}
                  <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
                <span className="text-sm font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Info */}
        <div className="p-5 bg-surface border border-border rounded-2xl">
          <p className="text-xs font-bold text-muted uppercase mb-3">Deployment Target</p>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
               <Globe size={20} className="text-primary" />
             </div>
             <div>
               <p className="text-sm font-bold">fastidious-schnauzer-265</p>
               <p className="text-[10px] text-muted">convex.cloud/api/v1</p>
             </div>
          </div>
          <button className="w-full py-2.5 bg-surface-2 border border-border rounded-lg text-xs font-bold text-muted flex items-center justify-center gap-2">
            View Cloud Logs <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
