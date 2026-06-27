import { formatContestRating } from '../../../utils/formatMetrics';

const METRICS = [
  {
    key: 'totalSolved',
    label: 'Problems solved',
    hint: 'Unique accepted problems on LeetCode',
    icon: '✓',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-200/60',
    text: 'text-violet-700',
    bg: 'bg-gradient-to-br from-violet-50 to-white',
    border: 'border-violet-100',
  },
  {
    key: 'avgMastery',
    label: 'Topic mastery',
    hint: 'Strength across DSA categories',
    suffix: '%',
    icon: '◆',
    gradient: 'from-brand-500 to-orange-500',
    glow: 'shadow-brand-200/60',
    text: 'text-brand-700',
    bg: 'bg-gradient-to-br from-brand-50 to-white',
    border: 'border-brand-100',
  },
  {
    key: 'streak',
    label: 'Day streak',
    hint: 'Consecutive days with submissions',
    suffix: ' days',
    icon: '🔥',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-200/60',
    text: 'text-amber-700',
    bg: 'bg-gradient-to-br from-amber-50 to-white',
    border: 'border-amber-100',
  },
  {
    key: 'acceptanceRate',
    label: 'First-try rate',
    hint: 'Accepted submissions vs total attempts',
    suffix: '%',
    icon: '◎',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-200/60',
    text: 'text-emerald-700',
    bg: 'bg-gradient-to-br from-emerald-50 to-white',
    border: 'border-emerald-100',
  },
  {
    key: 'easy',
    label: 'Easy',
    hint: 'Foundation problems cleared',
    icon: 'E',
    gradient: 'from-green-500 to-emerald-600',
    text: 'text-green-700',
    bg: 'bg-gradient-to-br from-green-50 to-white',
    border: 'border-green-100',
    compact: true,
  },
  {
    key: 'medium',
    label: 'Medium',
    hint: 'Core interview difficulty',
    icon: 'M',
    gradient: 'from-amber-500 to-yellow-500',
    text: 'text-amber-700',
    bg: 'bg-gradient-to-br from-amber-50 to-white',
    border: 'border-amber-100',
    compact: true,
  },
  {
    key: 'hard',
    label: 'Hard',
    hint: 'Advanced problem solving',
    icon: 'H',
    gradient: 'from-red-500 to-rose-600',
    text: 'text-red-700',
    bg: 'bg-gradient-to-br from-red-50 to-white',
    border: 'border-red-100',
    compact: true,
  },
  {
    key: 'contestRating',
    label: 'Contest rating',
    hint: 'LeetCode weekly contest performance',
    icon: '⚡',
    gradient: 'from-sky-500 to-blue-600',
    text: 'text-sky-700',
    bg: 'bg-gradient-to-br from-sky-50 to-white',
    border: 'border-sky-100',
    fallback: '—',
  },
];

export default function OverviewMetrics({ snapshot, analytics }) {
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

  const primary = METRICS.filter((m) => !m.compact);
  const difficulty = METRICS.filter((m) => m.compact);

  return (
    <div className="space-y-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="section-eyebrow">At a glance</p>
          <h3 className="text-lg font-bold text-slate-900">Your key numbers</h3>
        </div>
        <p className="text-xs text-slate-500 hidden sm:block">Hover a card to see what it means</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {primary.map((m, i) => (
          <MetricCard key={m.key} metric={m} value={values[m.key]} delay={i * 0.04} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Difficulty breakdown
        </p>
        <div className="grid grid-cols-3 gap-3">
          {difficulty.map((m, i) => (
            <MetricCard key={m.key} metric={m} value={values[m.key]} delay={0.15 + i * 0.04} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric, value, delay, compact }) {
  const display =
    metric.key === 'contestRating'
      ? formatContestRating(value)
      : value == null || value === ''
        ? metric.fallback ?? '—'
        : `${value}${metric.suffix || ''}`;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${metric.border} ${metric.bg} p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${metric.glow || ''} opacity-0 animate-scale-in`}
      style={{ animationDelay: `${delay}s` }}
      title={metric.hint}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.gradient}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p>
          <p
            className={`${compact ? 'text-2xl' : 'text-3xl'} font-black tabular-nums mt-1 ${metric.text}`}
          >
            {display}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 text-sm shadow-sm ${compact ? 'text-xs font-black' : ''}`}
          aria-hidden
        >
          {metric.icon}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 leading-snug opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-12 transition-all duration-300 overflow-hidden">
        {metric.hint}
      </p>
    </div>
  );
}
