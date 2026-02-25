import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBg: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconBg,
  onClick,
  badge,
  badgeColor = 'bg-red-500',
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 w-full text-left transition-all active:scale-95 ${
        onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {badge && (
            <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
