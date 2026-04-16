import type { ReactNode } from 'react';

export default function FloatingActionButton({
  icon,
  onClick,
  className = "",
}: {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`fixed right-6 bottom-32 z-40 w-14 h-14 rounded-2xl bg-primary text-primary-fg shadow-xl shadow-primary/25 flex items-center justify-center active:scale-90 transition-all ${className}`}
    >
      {icon}
    </button>
  );
}
