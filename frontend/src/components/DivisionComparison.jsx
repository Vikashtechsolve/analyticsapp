import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const METRICS = [
  { key: 'avgSolved', label: 'Avg solved', color: 'from-brand-500 to-amber-500', text: 'text-brand-400' },
  { key: 'avgStreak', label: 'Avg streak', color: 'from-sky-500 to-blue-500', text: 'text-sky-400' },
  { key: 'activeToday', label: 'Active today', color: 'from-emerald-500 to-teal-500', text: 'text-emerald-400' },
];

export default function DivisionComparison({ data, classroomSlug }) {

  const enriched = useMemo(() => {
    if (!data?.length) return [];
    const maxSolved = Math.max(...data.map((d) => d.avgSolved || 0), 1);
    const maxStreak = Math.max(...data.map((d) => d.avgStreak || 0), 1);
    const maxActive = Math.max(...data.map((d) => d.activeToday || 0), 1);
    const maxes = { avgSolved: maxSolved, avgStreak: maxStreak, activeToday: maxActive };

    const bestSolved = data.reduce((best, d) =>
      (d.avgSolved || 0) > (best?.avgSolved || 0) ? d : best
    , data[0]);

    return data.map((d) => ({
      ...d,
      isLeader: d.divisionId === bestSolved?.divisionId || d.name === bestSolved?.name,
      maxes,
    }));
  }, [data]);

  if (!enriched.length) return null;

  if (enriched.length === 1) {
    const d = enriched[0];
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.08),transparent_60%)]" />
        <div className="relative p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-sky-500/90 mb-1">
            Divisions
          </p>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Division Overview</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{d.name}</p>
            <p className="text-slate-500 text-sm mt-1">{d.totalStudents} students</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {METRICS.map((m) => (
                <div key={m.key} className="text-center">
                  <p className={`text-xl font-bold tabular-nums ${m.text}`}>{d[m.key] ?? 0}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.1),transparent_55%)]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative px-5 pt-5 pb-4 border-b border-slate-200">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-sky-500/90 mb-1">
          Divisions
        </p>
        <h2 className="text-lg font-bold text-slate-900">Division Comparison</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          How each batch performs · click a division to filter dashboard
        </p>
      </div>

      <div className="relative p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {enriched.map((div) => (
          <Link
            key={div.divisionId || div.slug || div.name}
            to={`/c/${classroomSlug}?division=${div.slug}`}
            className={`group relative rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] ${
              div.isLeader
                ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white hover:border-amber-400 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {div.isLeader && (
              <span className="absolute -top-2 -right-2 text-lg" title="Top avg solved">
                🏆
              </span>
            )}

            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                  {div.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {div.totalStudents} student{div.totalStudents !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-300 group-hover:border-brand-500/30 group-hover:text-brand-400 transition-colors">
                View →
              </span>
            </div>

            <div className="space-y-3">
              {METRICS.map((m) => {
                const val = div[m.key] ?? 0;
                const max = div.maxes[m.key] || 1;
                const pct = Math.round((val / max) * 100);
                return (
                  <div key={m.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{m.label}</span>
                      <span className={`font-bold tabular-nums ${m.text}`}>{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-700`}
                        style={{ width: `${Math.max(pct, val > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Link>
        ))}
      </div>

      {/* Summary strip */}
      <div className="relative px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-center sm:justify-start">
        {METRICS.map((m) => {
          const best = enriched.reduce((a, b) => ((a[m.key] || 0) >= (b[m.key] || 0) ? a : b));
          return (
            <div key={m.key} className="text-xs text-slate-500">
              Best {m.label.toLowerCase()}:{' '}
              <span className={`font-semibold ${m.text}`}>
                {best.name} ({best[m.key]})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
