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
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 transition-all active:scale-95 ${activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200'
              }`}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex p-1 bg-gray-100/80 rounded-xl mx-4 my-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-150 rounded-lg ${activeTab === tab.key
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {tab.emoji && <span className="text-base">{tab.emoji}</span>}
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span
              className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${activeTab === tab.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-200 text-gray-500'
                }`}
            >
              {tab.count > 9 ? '9+' : tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
