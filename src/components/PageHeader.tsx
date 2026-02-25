import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function PageHeader({ title, subtitle, showBack = false, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-100 px-4 pt-safe-top">
      <div className="flex items-center gap-3 h-14">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-1"
          >
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </div>
  );
}
