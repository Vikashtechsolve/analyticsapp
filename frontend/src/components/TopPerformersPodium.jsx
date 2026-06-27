import { Link } from 'react-router-dom';
import { formatContestRating, formatLeaderboardMetric } from '../utils/formatMetrics';

const SORT_LABELS = {
  score: 'Overall Score',
  totalSolved: 'Problems Solved',
  todaySolved: 'Solved Today',
  streak: 'Day Streak',
  weeklyActivity: 'Weekly Activity',
  contestRating: 'Contest Rating',
};

const RANK_THEME = {
  1: {
    medal: 'gold',
    ring: 'from-amber-400 via-yellow-300 to-amber-500',
    cardBorder: 'border-amber-300/80',
    cardBg: 'bg-gradient-to-b from-white to-amber-50/80',
    cardShadow: 'shadow-[0_8px_30px_rgba(251,191,36,0.25)]',
    score: 'text-amber-600',
    pedestalHeight: 'h-[88px] sm:h-[108px]',
    face: 'from-amber-300 via-yellow-400 to-amber-500',
    faceDeep: 'from-amber-500 to-amber-700',
    top: 'from-amber-100 to-amber-200',
    side: 'from-amber-600 to-amber-800',
    watermark: 'text-amber-600/25',
    labelStrip: 'bg-gradient-to-t from-amber-700/90 via-amber-600/40 to-transparent',
    glow: 'shadow-[0_16px_48px_rgba(251,191,36,0.45)]',
    medalLabel: 'Gold',
    delay: '0.15s',
    pedestalDelay: '0.25s',
    float: true,
  },
  2: {
    medal: 'silver',
    ring: 'from-slate-300 via-slate-200 to-slate-400',
    cardBorder: 'border-slate-200',
    cardBg: 'bg-gradient-to-b from-white to-slate-50',
    cardShadow: 'shadow-[0_6px_24px_rgba(100,116,139,0.12)]',
    score: 'text-slate-800',
    pedestalHeight: 'h-[68px] sm:h-[84px]',
    face: 'from-slate-200 via-slate-300 to-slate-400',
    faceDeep: 'from-slate-500 to-slate-700',
    top: 'from-slate-50 to-slate-200',
    side: 'from-slate-500 to-slate-700',
    watermark: 'text-slate-500/20',
    labelStrip: 'bg-gradient-to-t from-slate-600/90 via-slate-500/40 to-transparent',
    glow: 'shadow-[0_12px_32px_rgba(100,116,139,0.25)]',
    medalLabel: 'Silver',
    delay: '0.05s',
    pedestalDelay: '0.15s',
    float: false,
  },
  3: {
    medal: 'bronze',
    ring: 'from-orange-400 via-amber-500 to-orange-600',
    cardBorder: 'border-orange-200',
    cardBg: 'bg-gradient-to-b from-white to-orange-50/60',
    cardShadow: 'shadow-[0_6px_24px_rgba(234,88,12,0.15)]',
    score: 'text-orange-700',
    pedestalHeight: 'h-[52px] sm:h-[64px]',
    face: 'from-orange-300 via-amber-500 to-orange-600',
    faceDeep: 'from-orange-600 to-orange-800',
    top: 'from-orange-100 to-orange-300',
    side: 'from-orange-700 to-orange-900',
    watermark: 'text-orange-600/20',
    labelStrip: 'bg-gradient-to-t from-orange-800/90 via-orange-700/40 to-transparent',
    glow: 'shadow-[0_10px_28px_rgba(234,88,12,0.25)]',
    medalLabel: 'Bronze',
    delay: '0.25s',
    pedestalDelay: '0.35s',
    float: false,
  },
};

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const statValue = (row, sortBy) => {
  switch (sortBy) {
    case 'todaySolved':
      return row.todaySolved ?? 0;
    case 'totalSolved':
      return row.totalSolved;
    case 'streak':
      return row.streak;
    case 'weeklyActivity':
      return row.weeklyActivity;
    case 'contestRating':
      return formatContestRating(row.contestRating);
    default:
      return formatLeaderboardMetric(row.score, 'score');
  }
};

const statLabel = (sortBy) => {
  switch (sortBy) {
    case 'todaySolved':
      return 'Today';
    case 'totalSolved':
      return 'Solved';
    case 'streak':
      return 'Streak';
    case 'weeklyActivity':
      return 'Weekly';
    case 'contestRating':
      return 'Rating';
    default:
      return 'Score';
  }
};

function CrownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.5 19h19v2h-19v-2zm2.1-9.2 2.8 2.5 3.6-6.3 3.6 6.3 2.8-2.5 1.4 7.2h-15.6l1.4-7.2zm3.4 5.2h10l-.6-3.1-1.8 1.6-3.1-5.4-3.1 5.4-1.8-1.6-.6 3.1z" />
    </svg>
  );
}

function MedalIcon({ type, className }) {
  const fills = {
    gold: { outer: '#f59e0b', inner: '#fde68a', ribbon: '#d97706' },
    silver: { outer: '#94a3b8', inner: '#f1f5f9', ribbon: '#64748b' },
    bronze: { outer: '#ea580c', inner: '#fed7aa', ribbon: '#c2410c' },
  };
  const c = fills[type] || fills.gold;
  return (
    <svg className={className} viewBox="0 0 32 40" aria-hidden>
      <path d="M8 2 L12 14 L4 14 Z" fill={c.ribbon} />
      <path d="M24 2 L20 14 L28 14 Z" fill={c.ribbon} />
      <circle cx="16" cy="24" r="11" fill={c.outer} />
      <circle cx="16" cy="24" r="7" fill={c.inner} />
    </svg>
  );
}

function FlameIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 23c4.97 0 9-3.58 9-8 0-2.34-1.04-4.42-2.7-5.87C17.9 7.6 17 5.3 17 3c0-.55-.45-1-1-1-.28 0-.53.11-.71.3C13.4 4.47 12 7.07 12 10c0-2.5-1.2-4.73-3.07-6.14C8.75 3.67 8.5 3.56 8.22 3.56c-.55 0-1 .45-1 1 0 2.3-.9 4.6-2.3 6.13C3.04 10.58 2 12.66 2 15c0 4.42 4.03 8 9 8h1z" />
    </svg>
  );
}

function TodayRunnerCard({ row, rank, classroomSlug, leaderScore, index = 0 }) {
  const today = row.todaySolved ?? 0;

  return (
    <Link
      to={`/c/${classroomSlug}/student/${row.studentId}`}
      className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 overflow-hidden hover:border-emerald-300 hover:shadow-sm transition-all duration-200 opacity-0 animate-hof-rise"
      style={{ animationDelay: `${0.1 + index * 0.06}s` }}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
        {rank}
      </span>

      <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
        {initials(row.displayName)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
          {row.displayName}
        </p>
        <p className="text-xs text-slate-500 truncate">@{row.leetcodeUsername}</p>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center justify-end gap-1">
          <FlameIcon className="w-3.5 h-3.5 text-orange-500" />
          <p className="text-lg font-black text-emerald-600 tabular-nums">{today}</p>
        </div>
        <p className="text-[10px] font-medium text-slate-500">today</p>
      </div>
    </Link>
  );
}

function PodiumPedestal({ rank, theme, isFirst, delay }) {
  return (
    <div
      className={`relative w-full ${theme.pedestalHeight} opacity-0 animate-hof-pedestal origin-bottom`}
      style={{ animationDelay: delay }}
    >
      {/* Ground shadow */}
      <div className="absolute -bottom-2.5 left-[8%] right-[8%] h-4 rounded-[100%] bg-slate-900/10 blur-md" />

      {/* Top surface slab */}
      <div
        className={`absolute -top-1.5 left-0.5 right-3 h-2.5 rounded-t-sm bg-gradient-to-b ${theme.top} border-t border-x border-white/50`}
        style={{ transform: 'perspective(200px) rotateX(12deg)' }}
      />

      {/* 3D block */}
      <div className={`relative h-full flex ${theme.glow}`}>
        {/* Front face */}
        <div className="relative flex-1 rounded-t-xl overflow-hidden border-t border-x border-white/30">
          <div className={`absolute inset-0 bg-gradient-to-b ${theme.face}`} />
          <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t ${theme.faceDeep} opacity-60`} />

          {/* Subtle panel lines */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)',
            }}
          />

          {/* Watermark number */}
          <div className="absolute inset-0 flex items-center justify-center pt-1">
            <span
              className={`text-[4.5rem] sm:text-[5.5rem] font-black leading-none select-none ${theme.watermark}`}
              style={{ WebkitTextStroke: '1px rgba(255,255,255,0.12)' }}
              aria-hidden
            >
              {rank}
            </span>
          </div>

          {/* Gold shimmer */}
          {isFirst && (
            <div
              className="absolute inset-0 opacity-30 animate-hof-shimmer pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
                backgroundSize: '200% 100%',
              }}
            />
          )}

          {/* Glass highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
          <div className="absolute left-0 top-3 bottom-0 w-px bg-white/40" />

          {/* Label strip */}
          <div className={`absolute bottom-0 inset-x-0 pt-6 pb-2 flex flex-col items-center ${theme.labelStrip}`}>
            <span
              className="text-2xl sm:text-3xl font-black text-white leading-none"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
            >
              {rank}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-white/85 mt-1">
              {theme.medalLabel}
            </span>
          </div>
        </div>

        {/* Right depth face */}
        <div
          className={`w-3 sm:w-4 shrink-0 rounded-tr-md bg-gradient-to-b ${theme.side}`}
          style={{ boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.15)' }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5 min-w-0 flex-1">
      <span className={`text-sm font-bold tabular-nums text-slate-900 ${accent || ''}`}>{value}</span>
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}

function PodiumSpot({ row, rank, classroomSlug, sortBy, maxScore }) {
  const theme = RANK_THEME[rank];
  const isFirst = rank === 1;
  const score = statValue(row, sortBy);
  const numericScore = typeof score === 'number' ? score : 0;
  const pct = maxScore > 0 ? Math.round((numericScore / maxScore) * 100) : 0;

  return (
    <div
      className={`flex flex-col items-stretch flex-1 min-w-0 max-w-[240px] opacity-0 animate-hof-rise ${isFirst ? 'sm:-mt-2 z-10' : ''}`}
      style={{ animationDelay: theme.delay }}
    >
      <Link
        to={`/c/${classroomSlug}/student/${row.studentId}`}
        className={`group relative flex flex-col rounded-2xl border ${theme.cardBorder} ${theme.cardBg} ${theme.cardShadow} p-3 sm:p-4 mb-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.float ? 'sm:animate-hof-float' : ''}`}
      >
        {isFirst && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 blur-md rounded-full animate-hof-sparkle" />
              <CrownIcon className="relative w-7 h-7 text-amber-500 drop-shadow-md" />
            </div>
          </div>
        )}

        {/* Avatar + rank */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`rounded-xl p-[2px] bg-gradient-to-br ${theme.ring}`}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-[10px] bg-white flex items-center justify-center">
                <span className="text-base sm:text-lg font-extrabold bg-gradient-to-br from-brand-600 to-amber-600 bg-clip-text text-transparent">
                  {initials(row.displayName)}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1">
              <MedalIcon type={theme.medal} className="w-5 h-6 drop-shadow" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate group-hover:text-brand-700 transition-colors">
              {row.displayName}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">@{row.leetcodeUsername}</p>
            {row.division?.name && (
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-100">
                {row.division.name}
              </span>
            )}
          </div>
        </div>

        {/* Primary metric */}
        <div className="mt-3 flex items-baseline justify-between gap-2 rounded-xl bg-white/70 border border-slate-100 px-3 py-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {statLabel(sortBy)}
            </p>
            <p className={`text-2xl sm:text-3xl font-black tabular-nums leading-none mt-0.5 ${theme.score}`}>
              {score}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">vs leader</p>
            <p className="text-lg font-bold text-slate-700 tabular-nums">{pct}%</p>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="mt-2 flex gap-1.5">
          <StatChip label="Solved" value={row.totalSolved} />
          <StatChip label="Streak" value={`${row.streak}d`} accent={row.streak >= 7 ? 'text-emerald-600' : ''} />
          <StatChip label="Weekly" value={row.weeklyActivity} />
        </div>

        {/* Progress */}
        <div className="mt-2.5">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.ring} transition-all duration-1000 ease-out`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Link>

      <PodiumPedestal rank={rank} theme={theme} isFirst={isFirst} delay={theme.pedestalDelay} />
    </div>
  );
}

function TodayPodiumSpot({ row, rank, classroomSlug, leaderToday, runnerUpToday }) {
  const theme = RANK_THEME[rank];
  const isFirst = rank === 1;
  const today = row.todaySolved ?? 0;
  const pct = leaderToday > 0 ? Math.round((today / leaderToday) * 100) : 100;
  const gapToLeader = Math.max(leaderToday - today, 0);
  const leadOverNext = runnerUpToday != null ? today - runnerUpToday : 0;

  return (
    <div
      className={`flex flex-col items-stretch flex-1 min-w-0 max-w-[240px] opacity-0 animate-hof-rise ${
        isFirst ? 'sm:-mt-2 z-10' : ''
      }`}
      style={{ animationDelay: theme.delay }}
    >
      <Link
        to={`/c/${classroomSlug}/student/${row.studentId}`}
        className={`group relative flex flex-col rounded-2xl border ${theme.cardBorder} ${theme.cardBg} ${theme.cardShadow} p-3 sm:p-4 mb-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          theme.float ? 'sm:animate-hof-float' : ''
        }`}
      >
        {isFirst && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 blur-md rounded-full animate-hof-sparkle" />
              <CrownIcon className="relative w-7 h-7 text-amber-500 drop-shadow-md" />
            </div>
          </div>
        )}

        {/* Avatar + medal */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`rounded-xl p-[2px] bg-gradient-to-br ${theme.ring}`}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-[10px] bg-white flex items-center justify-center">
                <span className="text-base sm:text-lg font-extrabold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {initials(row.displayName)}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1">
              <MedalIcon type={theme.medal} className="w-5 h-6 drop-shadow" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate group-hover:text-emerald-700 transition-colors">
              {row.displayName}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">@{row.leetcodeUsername}</p>
            {row.division?.name && (
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                {row.division.name}
              </span>
            )}
          </div>
        </div>

        {/* Hero metric: solved today */}
        <div className="mt-3 rounded-xl bg-white/70 border border-slate-100 px-3 py-2.5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Solved today
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FlameIcon className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none text-emerald-600">
                  {today}
                </span>
              </div>
            </div>
            {isFirst ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                Leader
              </span>
            ) : gapToLeader > 0 ? (
              <span className="shrink-0 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 tabular-nums">
                −{gapToLeader} to #1
              </span>
            ) : (
              <span className="shrink-0 rounded-md bg-emerald-100 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700">
                Tied #1
              </span>
            )}
          </div>

          {/* Progress vs leader */}
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {isFirst && leadOverNext > 0 && (
            <p className="mt-1.5 text-[10px] font-semibold text-emerald-600">
              {leadOverNext} ahead of #2
            </p>
          )}
        </div>

        {/* Secondary stats */}
        <div className="mt-2 flex gap-1.5">
          <StatChip label="Solved" value={row.totalSolved} />
          <StatChip
            label="Streak"
            value={`${row.streak}d`}
            accent={row.streak >= 7 ? 'text-emerald-600' : ''}
          />
          <StatChip label="Weekly" value={row.weeklyActivity} />
        </div>
      </Link>

      <PodiumPedestal rank={rank} theme={theme} isFirst={isFirst} delay={theme.pedestalDelay} />
    </div>
  );
}

function ChallengerCard({ row, rank, classroomSlug, sortBy, maxScore, index = 0 }) {
  const score = statValue(row, sortBy);
  const numericScore = typeof score === 'number' ? score : 0;
  const pct = maxScore > 0 ? Math.round((numericScore / maxScore) * 100) : 0;

  return (
    <Link
      to={`/c/${classroomSlug}/student/${row.studentId}`}
      className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 overflow-hidden hover:border-brand-300 hover:shadow-md transition-all duration-300 opacity-0 animate-hof-rise"
      style={{ animationDelay: `${0.1 + index * 0.08}s` }}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
        {rank}
      </span>

      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-brand-100 to-amber-50 border border-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
        {initials(row.displayName)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-brand-700 transition-colors">
          {row.displayName}
        </p>
        <p className="text-xs text-slate-500 truncate">@{row.leetcodeUsername}</p>
        <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-black text-brand-600 tabular-nums">{score}</p>
        <p className="text-[10px] font-medium text-slate-500">{statLabel(sortBy)}</p>
        <div className="flex gap-2 mt-1 text-[10px] text-slate-600 font-medium">
          <span>{row.totalSolved} solved</span>
          <span>{row.streak}d streak</span>
        </div>
      </div>
    </Link>
  );
}

function PodiumStage({ count, children }) {
  // Keep the podium and its floor centered and sized to the number of winners
  // so 1–2 champions still read as a proper podium instead of stretching wide.
  const maxWidth = count <= 1 ? 280 : count === 2 ? 540 : 780;

  return (
    <div className="relative pt-2 pb-1">
      <div className="mx-auto w-full" style={{ maxWidth: `${maxWidth}px` }}>
        <div className="flex items-end justify-center gap-2 sm:gap-3 lg:gap-5 relative z-10">
          {children}
        </div>
        {/* Shared stage floor */}
        <div className="relative mt-1 mx-2 sm:mx-4">
          <div className="h-3 sm:h-4 rounded-b-xl bg-gradient-to-b from-slate-200 via-slate-100 to-slate-50 border border-t-0 border-slate-200 shadow-inner" />
          <div className="absolute inset-x-[10%] -bottom-1 h-2 rounded-[100%] bg-slate-900/8 blur-sm" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export default function TopPerformersPodium({
  items,
  classroomSlug,
  sortBy,
  onSortChange,
  maxItems = 5,
  showSortTabs = true,
  titlePrefix = 'Hall of',
  titleAccent = 'Fame',
  rankingScope = 'classroom',
  activeDivisionName,
  emptyTitle = 'Hall of Fame is empty',
  emptyMessage = 'Sync the classroom to reveal top performers.',
  accent = 'amber',
}) {
  const sorts = [
    { key: 'todaySolved', label: 'Today' },
    { key: 'score', label: 'Overall' },
    { key: 'totalSolved', label: 'Solved' },
    { key: 'streak', label: 'Streak' },
    { key: 'weeklyActivity', label: 'Weekly' },
    { key: 'contestRating', label: 'Contest' },
  ];

  const topN = items.slice(0, maxItems);
  const podiumOrder = [topN[1], topN[0], topN[2]].filter(Boolean);
  const runnersMid = maxItems > 5 ? topN.slice(3, 5) : topN.slice(3);
  const runnersRest = maxItems > 5 ? topN.slice(5) : [];
  const leaderToday = topN[0] ? (topN[0].todaySolved ?? 0) : 0;
  const leaderScore = topN[0] ? statValue(topN[0], sortBy) : 0;
  const maxScore = typeof leaderScore === 'number' ? leaderScore : 1;

  const isToday = sortBy === 'todaySolved' || accent === 'emerald';
  const scopeLabel =
    rankingScope === 'division' ? activeDivisionName || 'This division' : 'All students';
  const subtitle = isToday
    ? `${leaderToday} by today's leader · ${scopeLabel}`
    : `Top ${Math.min(maxItems, items.length) || maxItems} · ${SORT_LABELS[sortBy] || 'Score'} · ${scopeLabel}`;

  const headerGradient = isToday
    ? 'from-emerald-500 to-teal-500 shadow-emerald-200/50'
    : 'from-amber-400 to-orange-500 shadow-amber-200/50';
  const titleGradient = isToday
    ? 'from-emerald-600 to-teal-500'
    : 'from-amber-500 to-orange-500';
  const bgGlow = isToday ? 'rgba(16,185,129,0.06)' : 'rgba(251,191,36,0.08)';
  const topLine = isToday ? 'via-emerald-300/40' : 'via-amber-300/50';
  const emptyIconBg = isToday ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200';
  const emptyIconColor = isToday ? 'text-emerald-500' : 'text-amber-500';

  if (!items.length) {
    return (
      <div className="relative rounded-2xl border border-slate-200 bg-white p-12 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${bgGlow} 0%, transparent 70%)`,
          }}
        />
        <div className="relative">
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border mb-3 ${emptyIconBg}`}>
            <CrownIcon className={`w-7 h-7 ${emptyIconColor}`} />
          </div>
          <p className="text-slate-800 font-semibold">{emptyTitle}</p>
          <p className="text-slate-500 text-sm mt-1">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${bgGlow}, transparent)`,
        }}
      />
      <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${topLine} to-transparent`} />

      <div className="relative px-4 sm:px-6 pt-4 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-md ${headerGradient}`}
            >
              <CrownIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {titlePrefix}{' '}
                <span className={`bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
                  {titleAccent}
                </span>
              </h2>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          {showSortTabs && (
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 gap-0.5 flex-wrap">
              {sorts.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onSortChange?.(s.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    sortBy === s.key
                      ? isToday && s.key === 'todaySolved'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white text-brand-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {isToday ? (
          <PodiumStage count={podiumOrder.length}>
            {podiumOrder.map((row) => (
              <TodayPodiumSpot
                key={row.studentId}
                row={row}
                rank={row.rank}
                classroomSlug={classroomSlug}
                leaderToday={leaderToday}
                runnerUpToday={topN[1] ? topN[1].todaySolved ?? 0 : null}
              />
            ))}
          </PodiumStage>
        ) : (
          <PodiumStage count={podiumOrder.length}>
            {podiumOrder.map((row) => (
              <PodiumSpot
                key={row.studentId}
                row={row}
                rank={row.rank}
                classroomSlug={classroomSlug}
                sortBy={sortBy}
                maxScore={maxScore}
              />
            ))}
          </PodiumStage>
        )}

        {runnersMid.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 px-1">
              Rank 4–5
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {runnersMid.map((row, i) =>
                isToday ? (
                  <TodayRunnerCard
                    key={row.studentId}
                    row={row}
                    rank={row.rank}
                    classroomSlug={classroomSlug}
                    leaderScore={leaderToday}
                    index={i}
                  />
                ) : (
                  <ChallengerCard
                    key={row.studentId}
                    row={row}
                    rank={row.rank}
                    classroomSlug={classroomSlug}
                    sortBy={sortBy}
                    maxScore={maxScore}
                    index={i}
                  />
                )
              )}
            </div>
          </div>
        )}

        {runnersRest.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 px-1">
              Rank 6–10
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {runnersRest.map((row, i) => (
                <ChallengerCard
                  key={row.studentId}
                  row={row}
                  rank={row.rank}
                  classroomSlug={classroomSlug}
                  sortBy={sortBy}
                  maxScore={maxScore}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
