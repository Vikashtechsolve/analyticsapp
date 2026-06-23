import { Link } from 'react-router-dom';
import RankBadge from '../RankBadge';

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function ProfileHero({ student, snapshot, analytics, ranking, classroomSlug }) {
  const mastery = analytics?.avgMastery ?? 0;
  const overall = ranking?.primary?.overall;
  const division = ranking?.primary?.division;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-brand-50/40 p-6 md:p-8 shadow-sm">
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="relative">
        <Link
          to={`/c/${classroomSlug}`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400 transition-colors mb-5"
        >
          <span aria-hidden>←</span> Back to classroom
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 text-2xl font-bold text-white shadow-lg shadow-brand-900/40">
              {initials(student.displayName)}
            </div>
            {overall?.rank === 1 && (
              <span className="absolute -top-2 -right-2 text-xl" aria-hidden>
                👑
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">
                {student.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                {student.divisionId?.name}
              </span>
            </div>
            <p className="text-slate-400 text-sm md:text-base">
              @{student.leetcodeUsername}
              {student.classroomId?.name && (
                <>
                  <span className="text-slate-600 mx-2">·</span>
                  {student.classroomId?.name}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href={`https://leetcode.com/u/${student.leetcodeUsername}/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                LeetCode Profile ↗
              </a>
              {snapshot?.syncedAt && (
                <span className="text-xs text-slate-500 self-center">
                  Synced {new Date(snapshot.syncedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-4 shrink-0">
            {overall?.rank && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-center min-w-[88px]">
                <RankBadge rank={overall.rank} size="lg" className="mx-auto mb-1" />
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Class rank</p>
                <p className="text-xs text-slate-600 mt-0.5">of {overall.total}</p>
              </div>
            )}
            {division?.rank && (
              <div className="rounded-xl border border-brand-500/25 bg-brand-500/5 px-4 py-3 text-center min-w-[88px]">
                <RankBadge rank={division.rank} size="lg" className="mx-auto mb-1" />
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Div rank</p>
                <p className="text-xs text-slate-600 mt-0.5">of {division.total}</p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center min-w-[72px]">
              <p className="text-2xl font-bold text-brand-400 tabular-nums">{mastery}%</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Mastery</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center min-w-[72px]">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{snapshot?.totalSolved ?? '—'}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Solved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
