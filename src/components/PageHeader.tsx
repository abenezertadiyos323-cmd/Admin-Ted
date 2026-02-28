import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: ReactNode;
}

export default function PageHeader({ title, subtitle, showBack = false, backTo, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="sticky top-0 z-40 px-4 pt-safe-top"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-3 h-14">
        {showBack && (
          <button
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors -ml-1 active:scale-95"
            style={{ color: 'var(--text)' }}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg font-bold truncate"
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </div>
  );
}
