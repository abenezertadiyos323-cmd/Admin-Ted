import { NavLink } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Home, Package, ArrowLeftRight, MessageCircle } from 'lucide-react';

// ── Instagram-style notification badge ────────────────────────────────────
function NavBadge({ count }: { count: number | undefined }) {
  if (!count || count === 0) return null;
  const label = count >= 100 ? '99+' : String(count);
  return (
    <span
      style={{
        position: 'absolute',
        top: '-3px',
        right: count >= 10 ? '-7px' : '-5px',
        background: 'var(--badge)',
        color: '#fff',
        fontSize: '9px',
        fontWeight: 700,
        lineHeight: 1,
        borderRadius: '999px',
        padding: count >= 10 ? '2px 4px' : '2.5px 5px',
        minWidth: '15px',
        textAlign: 'center',
        border: '1.5px solid var(--bg)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
      }}
    >
      {label}
    </span>
  );
}

export default function BottomNav() {
  const inboxCount    = useQuery(api.threads.getInboxBadgeCount);
  const exchangeCount = useQuery(api.threads.getExchangeBadgeCount);

  const navItems = [
    { to: '/',          label: 'Home',     icon: Home,           badge: undefined },
    { to: '/inventory', label: 'Inventory', icon: Package,        badge: undefined },
    { to: '/exchanges', label: 'Exchange',  icon: ArrowLeftRight, badge: exchangeCount },
    { to: '/inbox',     label: 'Inbox',    icon: MessageCircle,  badge: inboxCount },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive ? '' : 'opacity-50 hover:opacity-75'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--primary)' : 'var(--muted)',
            })}
          >
            {({ isActive }) => (
              <>
                {/* Icon wrapper — positions badge relative to icon */}
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className="transition-transform active:scale-90"
                  />
                  <NavBadge count={badge} />
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
