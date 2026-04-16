import type { ReactNode } from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="text-muted">{icon}</div>
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              trend.positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-text">{value}</span>
        {subtitle && <span className="text-[10px] text-muted font-medium">{subtitle}</span>}
      </div>
    </div>
  );
}
