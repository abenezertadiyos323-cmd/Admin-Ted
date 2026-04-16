import type { ReactNode } from 'react';

export default function EmptyState({ 
  icon, 
  title, 
  subtitle 
}: { 
  icon: ReactNode; 
  title: string; 
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
      <div 
        className="w-20 h-20 rounded-3xl bg-surface-2 border border-border flex items-center justify-center mb-6 text-muted shadow-sm"
      >
        {icon}
      </div>
      <h3 
        className="text-lg font-bold mb-2 tracking-tight" 
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h3>
      <p 
        className="text-sm font-medium leading-relaxed max-w-[240px]" 
        style={{ color: 'var(--muted)' }}
      >
        {subtitle}
      </p>
    </div>
  );
}
