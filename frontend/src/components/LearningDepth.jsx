import MasteryRing from './mastery/MasteryRing';

const METRICS = [
  {
    key: 'firstAttemptSuccessRate',
    label: 'First-try success',
    hint: 'How often you accept on early attempts',
    suffix: '%',
    icon: '🎯',
    color: '#10b981',
    text: 'text-emerald-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-white',
    border: 'border-emerald-100',
  },
  {
    key: 'estimatedWrongSubmissions',
    label: 'Wrong before AC',
    hint: 'Extra submissions before accepted solves',
    icon: '↻',
    color: '#64748b',
    text: 'text-slate-800',
    bg: 'bg-gradient-to-br from-slate-50 to-white',
    border: 'border-slate-200',
  },
  {
    key: 'avgAttemptsPerSolve',
    label: 'Avg attempts / solve',
    hint: 'Submissions per unique problem solved',
    icon: '÷',
    color: '#6366f1',
    text: 'text-indigo-600',
    bg: 'bg-gradient-to-br from-indigo-50 to-white',
    border: 'border-indigo-100',
  },
  {
    key: 'reSolvedCount',
    label: 'Re-solved problems',
    hint: 'Problems you solved more than once',
    icon: '🔁',
    color: '#ea580c',
    text: 'text-brand-600',
    bg: 'bg-gradient-to-br from-brand-50 to-white',
    border: 'border-brand-100',
  },
];

export default function LearningDepth({ depth, variant }) {
  if (!depth) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center py-12 px-6">
        <span className="text-3xl mb-2 block" aria-hidden>
          📊
        </span>
        <p className="text-slate-800 font-semibold">Learning depth metrics building…</p>
        <p className="text-slate-500 text-sm mt-1">More data appears as problem-level syncs complete.</p>
      </div>
    );
  }

  const { difficultySplit } = depth;
  const total =
    (difficultySplit?.easy || 0) + (difficultySplit?.medium || 0) + (difficultySplit?.hard || 0) || 1;
  const isMastery = variant === 'mastery';

  return (
    <div className="space-y-6">
      {depth.dataNote && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 leading-relaxed">
          <span className="font-semibold text-slate-700">Note: </span>
          {depth.dataNote}
        </p>
      )}

      <div className={`grid grid-cols-2 ${isMastery ? 'lg:grid-cols-4' : ''} gap-3`}>
        {METRICS.map((m, i) => (
          <div
            key={m.key}
            className={`relative overflow-hidden rounded-2xl border ${m.border} ${m.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md opacity-0 animate-scale-in`}
            style={{ animationDelay: `${i * 0.05}s` }}
            title={m.hint}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.label}</p>
                <p className={`text-2xl sm:text-3xl font-black tabular-nums mt-1 ${m.text}`}>
                  {depth[m.key]}
                  {m.suffix || ''}
                </p>
              </div>
              {isMastery ? (
                <MasteryRing
                  value={m.suffix === '%' ? depth[m.key] : Math.min(100, (depth[m.key] || 0) * 10)}
                  size={48}
                  stroke={4}
                  color={m.color}
                >
                  <span className="text-sm" aria-hidden>
                    {m.icon}
                  </span>
                </MasteryRing>
              ) : (
                <span className="text-xl" aria-hidden>
                  {m.icon}
                </span>
              )}
            </div>
            {isMastery && (
              <p className="text-[10px] text-slate-500 mt-2 leading-snug">{m.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Re-solve habits</p>
            <p className="text-sm font-semibold text-slate-800">Difficulty mix when revisiting problems</p>
          </div>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-white border border-slate-200 mb-4 shadow-inner">
          {[
            { key: 'easy', color: 'bg-green-500', val: difficultySplit?.easy },
            { key: 'medium', color: 'bg-amber-500', val: difficultySplit?.medium },
            { key: 'hard', color: 'bg-red-500', val: difficultySplit?.hard },
          ].map(
            (d) =>
              d.val > 0 && (
                <div
                  key={d.key}
                  className={`${d.color} transition-all duration-700`}
                  style={{ width: `${(d.val / total) * 100}%` }}
                />
              )
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Easy', val: difficultySplit?.easy, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
            { label: 'Medium', val: difficultySplit?.medium, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Hard', val: difficultySplit?.hard, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          ].map((d) => (
            <div key={d.label} className={`rounded-xl border ${d.bg} p-3 text-center`}>
              <p className={`text-2xl font-black tabular-nums ${d.color}`}>{d.val ?? 0}</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {depth.reSolvedProblems?.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recently re-solved</p>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            {depth.reSolvedProblems.map((p, i) => (
              <li
                key={p.slug}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 border border-brand-100 text-brand-600 text-xs font-bold">
                    {p.solveCount}×
                  </span>
                  <span className="text-slate-800 font-semibold text-sm truncate">{p.title}</span>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                  Revisited
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
