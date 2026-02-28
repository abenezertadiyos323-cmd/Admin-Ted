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
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        {icon}
      </div>
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          {subtitle}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
