import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowRightLeft, MessageSquare, PlusCircle } from 'lucide-react';
import Badge from './Badge';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Stock' },
  { to: '/inventory/add', icon: PlusCircle, label: 'Add', isAction: true },
  { to: '/exchanges', icon: ArrowRightLeft, label: 'Trades', badge: 'exchanges' as const },
  { to: '/inbox', icon: MessageSquare, label: 'Inbox', badge: 'inbox' as const },
];

export default function BottomNav() {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-2.5 border-t border-border"
      style={{ 
        background: 'rgba(18, 26, 42, 0.88)', 
        backdropFilter: 'blur(24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
      }}
    >
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              relative flex flex-col items-center gap-1 min-w-[64px] transition-all duration-200
              ${isActive ? 'scale-105 active:scale-100' : 'opacity-60 grayscale-[0.5]'}
              ${item.isAction ? 'px-2' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`
                  p-1.5 rounded-xl transition-all
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-muted'}
                  ${item.isAction ? 'p-0 text-primary opacity-100' : ''}
                `}>
                  {item.isAction ? (
                    <PlusCircle size={32} />
                  ) : (
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                  {item.badge && <Badge type={item.badge} />}
                </div>
                {!item.isAction && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted'}`}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
