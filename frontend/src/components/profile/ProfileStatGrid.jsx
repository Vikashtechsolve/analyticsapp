const STATS = [
  {
    key: 'totalSolved',
    label: 'Solved',
    accent: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 border-violet-100',
    text: 'text-violet-700',
  },
  {
    key: 'avgMastery',
    label: 'Mastery',
    suffix: '%',
    accent: 'from-brand-500 to-orange-500',
    bg: 'bg-brand-50 border-brand-100',
    text: 'text-brand-700',
  },
  {
    key: 'streak',
    label: 'Streak',
    suffix: 'd',
    accent: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 border-amber-100',
    text: 'text-amber-700',
  },
  {
    key: 'acceptanceRate',
    label: 'Accept',
    suffix: '%',
    accent: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 border-emerald-100',
    text: 'text-emerald-700',
  },
  {
    key: 'easy',
    label: 'Easy',
    accent: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 border-green-100',
    text: 'text-green-700',
  },
  {
    key: 'medium',
    label: 'Medium',
    accent: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-50 border-amber-100',
    text: 'text-amber-700',
  },
  {
    key: 'hard',
    label: 'Hard',
    accent: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 border-red-100',
    text: 'text-red-700',
  },
  {
    key: 'contestRating',
    label: 'Contest',
    accent: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 border-sky-100',
    text: 'text-sky-700',
    fallback: 'N/A',
  },
];

export default function ProfileStatGrid({ snapshot, analytics }) {
  const values = {
    totalSolved: snapshot?.totalSolved ?? 0,
    avgMastery: analytics?.avgMastery ?? 0,
    streak: snapshot?.streak ?? 0,
    acceptanceRate: snapshot?.acceptanceRate ?? 0,
    easy: snapshot?.easy ?? 0,
    medium: snapshot?.medium ?? 0,
    hard: snapshot?.hard ?? 0,
    contestRating: snapshot?.contestRating ?? null,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {STATS.map(({ key, label, suffix, accent, bg, text, fallback }, i) => {
        const raw = values[key];
        const display =
          raw == null || raw === '' ? fallback ?? '—' : `${raw}${suffix || ''}`;
        return (
          <div
            key={key}
            className={`relative overflow-hidden rounded-xl border p-3 ${bg} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 opacity-0 animate-scale-in`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent}`} />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p className={`text-xl sm:text-2xl font-extrabold mt-1 tabular-nums ${text}`}>
              {display}
            </p>
          </div>
        );
      })}
    </div>
  );
}
