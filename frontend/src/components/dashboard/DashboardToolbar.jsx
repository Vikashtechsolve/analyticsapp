import { Link } from 'react-router-dom';

const MINI_STATS = [
  { key: 'totalStudents', label: 'Students' },
  { key: 'avgSolved', label: 'Avg solved' },
  { key: 'activeToday', label: 'Active today' },
  { key: 'avgStreak', label: 'Avg streak' },
];

export default function DashboardToolbar({
  classroom,
  divisions,
  divisionSlug,
  onDivisionChange,
  lastSync,
  joinSlug,
  summary,
}) {
  const activeDivision = divisions.find((d) => d.slug === divisionSlug);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{classroom.name}</h1>
            {activeDivision && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-brand-100 text-brand-700">
                {activeDivision.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => onDivisionChange('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  !divisionSlug
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {divisions.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => onDivisionChange(d.slug)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    divisionSlug === d.slug
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
            <Link
              to={`/c/${joinSlug}/join`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
            >
              Join →
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-600 divide-x divide-slate-200">
          {MINI_STATS.map((stat) => (
            <span key={stat.key} className="inline-flex items-center gap-1 pl-3 first:pl-0">
              <span className="font-bold text-slate-900 tabular-nums">{summary[stat.key] ?? '—'}</span>
              <span>{stat.label}</span>
            </span>
          ))}
          <span className="text-slate-400 pl-3 hidden md:inline">Updated {lastSync}</span>
        </div>
      </div>
    </header>
  );
}
