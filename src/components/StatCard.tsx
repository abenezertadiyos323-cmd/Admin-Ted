import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBg: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string; // kept for API compat but ignored — always uses var(--badge)
}

export default function StatCard({
  title,
  value,
  icon,
  iconBg,
  onClick,
  badge,
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-4 flex items-center gap-3 w-full text-left transition-all duration-150 active:scale-[0.99] ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--muted)' }}>{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
          {badge && (
            <span
              className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
              style={{
                background: 'var(--badge)',
                border: '1px solid var(--bg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
