const DIFF_BADGE = {
  Easy: 'bg-green-50 text-green-700 border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-red-50 text-red-700 border-red-200',
};

const DIFF_GLOW = {
  Easy: 'from-green-500/10',
  Medium: 'from-amber-500/10',
  Hard: 'from-red-500/10',
};

export default function RecentSolvesList({ solves, variant }) {
  if (!solves?.length) return null;

  const isOverview = variant === 'overview';

  if (isOverview) {
    return (
      <ul className="divide-y divide-slate-100">
        {solves.slice(0, 6).map((s, i) => {
          const diff = s.difficulty || 'Medium';
          const badge = DIFF_BADGE[diff] || DIFF_BADGE.Medium;
          const glow = DIFF_GLOW[diff] || DIFF_GLOW.Medium;
          return (
            <li
              key={`${s.slug}-${i}`}
              className={`relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r ${glow} to-transparent hover:bg-slate-50 transition-colors group opacity-0 animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-500 shadow-sm">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                {s.slug ? (
                  <a
                    href={`https://leetcode.com/problems/${s.slug}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors truncate block"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span className="text-sm font-bold text-slate-800 truncate block">{s.title}</span>
                )}
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {s.timestamp
                    ? new Date(s.timestamp * 1000).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recently solved'}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border ${badge}`}>
                {diff}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 h-full">
      <p className="text-sm font-semibold text-slate-800 mb-1">Recent solves</p>
      <p className="text-xs text-slate-500 mb-3">Latest accepted submissions</p>
      <div className="space-y-1">
        {solves.map((s, i) => {
          const diff = s.difficulty || 'Medium';
          const badge = DIFF_BADGE[diff] || DIFF_BADGE.Medium;
          return (
            <div
              key={`${s.slug}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-white border border-slate-100 px-3 py-2.5 hover:border-brand-200 hover:shadow-sm transition-all group opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-slate-400 text-[10px] font-bold w-5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  {s.slug ? (
                    <a
                      href={`https://leetcode.com/problems/${s.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate block"
                    >
                      {s.title}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 truncate block">{s.title}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge}`}>
                  {diff}
                </span>
                <span className="text-[10px] text-slate-500 tabular-nums w-14 text-right font-medium">
                  {s.timestamp
                    ? new Date(s.timestamp * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
