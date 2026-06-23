export default function AdminTabs({ tabs, active, onChange, label = 'Dashboard sections' }) {
  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-0.5 mb-4 border-b border-slate-200"
      aria-label={label}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative shrink-0 flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
              isActive
                ? 'border-brand-600 text-brand-700 bg-brand-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.icon && (
              <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>{tab.icon}</span>
            )}
            {tab.label}
            {tab.badge > 0 && (
              <span
                className={`ml-0.5 min-w-[1.125rem] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive ? 'bg-brand-600 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
