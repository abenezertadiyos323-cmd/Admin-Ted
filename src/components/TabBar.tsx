interface Tab {
  id: string;
  label: string;
  badge?: number;
}

export default function TabBar({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div 
      className={`flex bg-surface border-b border-border sticky top-[68px] z-20 overflow-x-auto scrollbar-hide ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 min-w-[100px] py-4 px-2 text-xs font-black uppercase tracking-widest relative transition-all
            ${activeTab === tab.id ? 'text-primary' : 'text-muted'}
          `}
        >
          <div className="flex items-center justify-center gap-1.5">
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="min-w-[16px] h-4 rounded-full bg-badge text-[9px] font-black text-white flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </div>
          {activeTab === tab.id && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" 
            />
          )}
        </button>
      ))}
    </div>
  );
}
