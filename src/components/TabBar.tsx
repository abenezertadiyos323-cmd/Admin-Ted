interface Tab {
  key: string;
  label: string;
  count?: number;
  emoji?: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'default' | 'pill';
}

export default function TabBar({ tabs, activeTab, onTabChange, variant = 'default' }: TabBarProps) {
  if (variant === 'pill') {
    return (
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
              style={{
                background: isActive ? 'var(--primary)' : 'var(--surface)',
                color:      isActive ? 'var(--primary-foreground)' : 'var(--muted)',
                border:     isActive ? 'none' : '1px solid var(--border)',
              }}
            >
              {tab.emoji && <span>{tab.emoji}</span>}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(0,0,0,0.15)' : 'var(--surface-2)',
                    color:      isActive ? 'var(--primary-foreground)' : 'var(--muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex p-1 rounded-xl mx-4 my-2"
      style={{ background: 'var(--surface-2)' }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-150 rounded-lg"
            style={{
              background: isActive ? 'var(--surface)' : 'transparent',
              color:      isActive ? 'var(--primary)' : 'var(--muted)',
              boxShadow:  isActive ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {tab.emoji && <span className="text-base">{tab.emoji}</span>}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  background: isActive ? 'var(--primary)' : 'rgba(148,163,184,0.15)',
                  color:      isActive ? 'var(--primary-foreground)' : 'var(--muted)',
                }}
              >
                {tab.count > 9 ? '9+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
