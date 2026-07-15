import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RankBadge from './RankBadge';
import { formatLeaderboardMetric } from '../utils/formatMetrics';
import { LEADERBOARD_SORT_OPTIONS } from '../utils/leaderboardSort';

export default function Leaderboard({
  items,
  classroomSlug,
  sortBy,
  onSortChange,
  rankingScope = 'classroom',
  limit,
}) {
  const [search, setSearch] = useState('');
  const sorts = LEADERBOARD_SORT_OPTIONS;
  const isDivision = rankingScope === 'division';
  const isTodayView = sortBy === 'todaySolved';

  const rankedItems = useMemo(() => {
    if (!limit) return items;
    return items.slice(0, limit);
  }, [items, limit]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rankedItems;
    return rankedItems.filter(
      (row) =>
        row.displayName.toLowerCase().includes(q) ||
        row.leetcodeUsername.toLowerCase().includes(q) ||
        row.division?.name?.toLowerCase().includes(q)
    );
  }, [rankedItems, search]);

  const primaryMetricHeader =
    sortBy === 'todaySolved'
      ? 'Today'
      : sortBy === 'streak'
        ? 'Streak'
        : sortBy === 'weeklyActivity'
          ? 'Weekly'
          : sortBy === 'contestRating'
            ? 'Rating'
            : sortBy === 'totalSolved'
              ? 'Solved'
              : 'Score';

  const isContestView = sortBy === 'contestRating';

  const primaryMetricValue = (row) => formatLeaderboardMetric(
    sortBy === 'todaySolved'
      ? row.todaySolved
      : sortBy === 'totalSolved'
        ? row.totalSolved
        : sortBy === 'streak'
          ? row.streak
          : sortBy === 'weeklyActivity'
            ? row.weeklyActivity
            : sortBy === 'contestRating'
              ? row.contestRating
              : row.score,
    sortBy
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col p-0 overflow-hidden shadow-sm">
      {/* Header — fixed */}
      <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isTodayView ? "Today's Top 10" : 'Full Rankings'}
            </h2>
            <p className="text-slate-600 text-sm mt-0.5">
              {isTodayView
                ? 'Students who solved the most problems today'
                : isDivision
                  ? 'Division order · class rank in column'
                  : 'All students · scroll inside panel'}
              {rankedItems.length > 0 && (
                <span className="text-slate-600 ml-1">
                  · {isTodayView ? `top ${rankedItems.length}` : `${rankedItems.length} ranked`}
                </span>
              )}
            </p>
          </div>
          <input
            className="input max-w-full sm:max-w-[200px] text-sm py-1.5"
            placeholder="Search rankings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 flex-wrap mt-3">
          {sorts.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSortChange?.(s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sortBy === s.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable table */}
      {!filtered.length ? (
        <p className="text-slate-500 py-12 text-center text-sm">
          {search
            ? 'No students match your search'
            : isTodayView
              ? 'No submissions yet today'
              : 'No student data yet'}
        </p>
      ) : (
        <div
          className={`relative flex-1 min-h-0 overflow-x-auto ${
            isTodayView ? '' : 'max-h-[min(420px,55vh)] overflow-y-auto'
          }`}
        >
          <table className="w-full min-w-[320px] text-sm table-fixed">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(226,232,240)]">
              <tr className="text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <th className="text-left py-2.5 pl-4 sm:pl-5 pr-2 w-14">{isDivision ? 'Div' : 'Rank'}</th>
                <th className="text-left py-2.5 pr-3">Student</th>
                <th className="text-left py-2.5 pr-3 hidden md:table-cell w-[18%]">Division</th>
                {isDivision && (
                  <th className="text-center py-2.5 pr-2 hidden lg:table-cell w-16">Class</th>
                )}
                {!isDivision && (
                  <th className="text-center py-2.5 pr-2 hidden lg:table-cell w-16">Div</th>
                )}
                <th
                  className={`text-right py-2.5 pr-3 ${
                    isContestView ? 'w-[5.5rem] min-w-[5.5rem]' : 'w-16'
                  }`}
                >
                  {primaryMetricHeader}
                </th>
                <th className="text-right py-2.5 pr-3 w-16 hidden sm:table-cell">Solved</th>
                <th className="text-right py-2.5 pr-3 w-14 hidden sm:table-cell">Str</th>
                <th className="text-right py-2.5 pr-4 sm:pr-5 w-14 hidden md:table-cell">Wk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.studentId}
                  className="border-b border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <td className="py-2 pl-4 sm:pl-5 pr-2">
                    <RankBadge rank={row.rank} size="sm" />
                  </td>
                  <td className="py-2 pr-3 min-w-[140px]">
                    <Link
                      to={`/c/${classroomSlug}/student/${row.studentId}`}
                      className="text-slate-900 hover:text-brand-600 font-semibold transition-colors line-clamp-1"
                    >
                      {row.displayName}
                    </Link>
                    <span className="text-slate-500 text-xs block truncate">
                      @{row.leetcodeUsername}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-500 text-xs hidden md:table-cell truncate max-w-[100px]">
                    {row.division?.name || '—'}
                  </td>
                  {isDivision ? (
                    <td className="py-2 pr-2 text-center hidden lg:table-cell">
                      {row.overallRank ? (
                        <RankBadge rank={row.overallRank} size="sm" />
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  ) : (
                    <td className="py-2 pr-2 text-center hidden lg:table-cell">
                      {row.divisionRank ? (
                        <RankBadge rank={row.divisionRank} size="sm" />
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td
                    className={`py-2 pr-3 text-right font-bold tabular-nums whitespace-nowrap overflow-hidden text-ellipsis ${
                      isTodayView ? 'text-emerald-600' : 'text-slate-900'
                    } ${isContestView ? 'text-sm' : ''}`}
                    title={isContestView ? String(primaryMetricValue(row)) : undefined}
                  >
                    {primaryMetricValue(row)}
                  </td>
                  <td className="py-2 pr-3 text-right font-bold tabular-nums text-slate-900 hidden sm:table-cell">
                    {row.totalSolved}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-700 font-medium hidden sm:table-cell">
                    {row.streak}
                  </td>
                  <td className="py-2 pr-4 sm:pr-5 text-right tabular-nums text-slate-700 font-medium hidden md:table-cell">
                    {row.weeklyActivity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="shrink-0 px-4 sm:px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Showing {filtered.length}
            {search ? ` of ${rankedItems.length}` : ''} students
          </span>
          {!isTodayView && filtered.length > 8 && (
            <span className="text-slate-600">Scroll for more ↑↓</span>
          )}
        </div>
      )}
    </div>
  );
}
