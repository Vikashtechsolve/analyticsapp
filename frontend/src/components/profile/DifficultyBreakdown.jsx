const DIFF_CONFIG = [
  {
    key: 'easy',
    label: 'Easy',
    desc: 'Building fundamentals',
    color: 'bg-green-500',
    ring: 'stroke-green-500',
    text: 'text-green-600',
    bg: 'bg-green-50 border-green-100',
    icon: '🌱',
  },
  {
    key: 'medium',
    label: 'Medium',
    desc: 'Interview-ready skills',
    color: 'bg-amber-500',
    ring: 'stroke-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    icon: '⚡',
  },
  {
    key: 'hard',
    label: 'Hard',
    desc: 'Advanced challenges',
    color: 'bg-red-500',
    ring: 'stroke-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50 border-red-100',
    icon: '💎',
  },
];

function DonutRing({ items, total }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative w-32 h-32 shrink-0 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        {items.map((item) => {
          if (!item.value) return null;
          const pct = item.value / total;
          const dash = pct * c;
          const el = (
            <circle
              key={item.key}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              className={item.ring}
              strokeWidth="10"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-black text-slate-900 tabular-nums">{total}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
      </div>
    </div>
  );
}

export default function DifficultyBreakdown({ snapshot, variant }) {
  if (!snapshot) return null;

  const items = DIFF_CONFIG.map((d) => ({
    ...d,
    value: snapshot[d.key] || 0,
  }));
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const isOverview = variant === 'overview';

  if (isOverview) {
    return (
      <div className="space-y-5">
        <DonutRing items={items} total={items.reduce((s, i) => s + i.value, 0)} />

        <div className="space-y-2">
          {items.map((item, i) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div
                key={item.key}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 opacity-0 animate-slide-in-right"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span aria-hidden>{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black tabular-nums ${item.text}`}>{item.value}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{pct}%</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white border border-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 h-full">
      <p className="text-sm font-semibold text-slate-800 mb-1">Difficulty breakdown</p>
      <p className="text-xs text-slate-500 mb-4">{total} problems across all levels</p>

      <div className="flex h-4 rounded-full overflow-hidden bg-white border border-slate-200 mb-5">
        {items.map(
          (item) =>
            item.value > 0 && (
              <div
                key={item.key}
                className={`${item.color} transition-all duration-700`}
                style={{ width: `${(item.value / total) * 100}%` }}
                title={`${item.label}: ${item.value}`}
              />
            )
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <div
            key={item.key}
            className={`rounded-xl border p-3 text-center ${item.bg} opacity-0 animate-scale-in`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <p className={`text-2xl font-black tabular-nums ${item.text}`}>{item.value}</p>
            <p className="text-xs text-slate-600 font-medium mt-1">{item.label}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {Math.round((item.value / total) * 100)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
