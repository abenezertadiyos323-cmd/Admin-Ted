import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-4">{subtitle}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
