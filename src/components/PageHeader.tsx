import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  backTo,
  action,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <header 
      className="px-4 pt-12 pb-6 bg-surface border-b border-border sticky top-0 z-30 pt-safe-top"
      style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(18, 26, 42, 0.94)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {backTo && (
            <button 
              onClick={() => navigate(backTo)}
              className="p-1 -ml-1 text-muted active:scale-90 transition-transform"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
