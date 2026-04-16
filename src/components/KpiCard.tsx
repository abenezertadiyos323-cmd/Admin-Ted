import { LayoutDashboard, Smartphone, ClipboardCheck, ArrowUpRight } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  trend?: string;
  icon: 'revenue' | 'leads' | 'stock' | 'exchanges';
}) {
  const getIcon = () => {
    switch (icon) {
      case 'revenue': return <LayoutDashboard size={18} className="text-green-500" />;
      case 'leads': return <Smartphone size={18} className="text-blue-500" />;
      case 'stock': return <ClipboardCheck size={18} className="text-primary" />;
      case 'exchanges': return <ArrowUpRight size={18} className="text-purple-500" />;
    }
  };

  return (
    <div 
      className="p-4 rounded-2xl border border-border bg-surface shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
          {getIcon()}
        </div>
        {trend && (
          <span className="text-[10px] font-black py-1 px-2 rounded-lg bg-green-500/10 text-green-500 uppercase tracking-wider">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}
