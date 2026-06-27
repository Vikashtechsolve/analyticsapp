import { useState } from 'react';
import { Link } from 'react-router-dom';
import { classroomApi } from '../api/client';
import RankBadge from './RankBadge';
import StudentAdminMeta, { matchesStudentAdminSearch } from './admin/StudentAdminMeta';

const RESULT_PREVIEW = 10;

const DEFAULT_FILTERS = {
  inactive: { enabled: false, days: 7 },
  lowSolvesInPeriod: { enabled: false, fewerThan: 3, period: 'week', days: 14 },
  lowMastery: { enabled: false, below: 40 },
  lowStreak: { enabled: false, below: 2 },
  belowClassAverage: { enabled: false, metric: 'totalSolved', percentOfClassAvg: 70 },
  noRecentActivity: { enabled: false, days: 14 },
  syncIssue: { enabled: false },
};

const PRESETS = [
  {
    id: 'inactive-7',
    label: 'Inactive 7d',
    matchMode: 'all',
    patch: { inactive: { enabled: true, days: 7 } },
  },
  {
    id: 'inactive-14',
    label: 'Inactive 14d',
    matchMode: 'all',
    patch: { inactive: { enabled: true, days: 14 } },
  },
  {
    id: 'low-week',
    label: '<3 solves / week',
    matchMode: 'all',
    patch: { lowSolvesInPeriod: { enabled: true, fewerThan: 3, period: 'week' } },
  },
  {
    id: 'low-month',
    label: '<5 solves / month',
    matchMode: 'all',
    patch: { lowSolvesInPeriod: { enabled: true, fewerThan: 5, period: 'month' } },
  },
  {
    id: 'custom-period',
    label: '<2 in 14 days',
    matchMode: 'all',
    patch: {
      lowSolvesInPeriod: { enabled: true, fewerThan: 2, period: 'days', days: 14 },
    },
  },
  {
    id: 'low-mastery',
    label: 'Low mastery',
    matchMode: 'all',
    patch: { lowMastery: { enabled: true, below: 40 } },
  },
  {
    id: 'at-risk',
    label: 'At-risk (any)',
    matchMode: 'any',
    patch: {
      inactive: { enabled: true, days: 7 },
      lowMastery: { enabled: true, below: 35 },
      lowStreak: { enabled: true, below: 2 },
    },
  },
  {
    id: 'underperform',
    label: 'Below class avg',
    matchMode: 'all',
    patch: { belowClassAverage: { enabled: true, metric: 'totalSolved', percentOfClassAvg: 60 } },
  },
];

function FilterToggle({ enabled, onChange, title, description, children }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        enabled ? 'border-brand-500/40 bg-brand-500/5' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 rounded border-slate-600 text-brand-600 focus:ring-brand-500"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm">{title}</p>
          <p className="text-slate-500 text-xs mt-0.5">{description}</p>
          {enabled && children && <div className="mt-3 flex flex-wrap gap-2 items-center">{children}</div>}
        </div>
      </label>
    </div>
  );
}

export default function TeacherStudentFilter({
  classroomId,
  classroomSlug,
  divisions,
  divisionId,
  hideHeader = false,
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [matchMode, setMatchMode] = useState('all');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const setFilter = (key, patch) => {
    setFilters((f) => ({ ...f, [key]: { ...f[key], ...patch } }));
  };

  const applyPreset = (preset) => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...Object.fromEntries(
        Object.entries(preset.patch).map(([k, v]) => [k, { ...DEFAULT_FILTERS[k], ...v }])
      ),
    });
    setMatchMode(preset.matchMode || 'all');
    setResultsExpanded(false);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setMatchMode('all');
    setSearch('');
    setResult(null);
    setError('');
    setResultsExpanded(false);
  };

  const runFilter = async () => {
    setLoading(true);
    setError('');
    setResultsExpanded(false);
    try {
      const res = await classroomApi.studentFilters(classroomId, {
        divisionId: divisionId || undefined,
        matchMode,
        filters,
        search,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Filter failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = Object.values(filters).filter((f) => f.enabled).length;
  const matchedRows = result?.matched || [];
  const visibleRows = resultsExpanded ? matchedRows : matchedRows.slice(0, RESULT_PREVIEW);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-brand-500 to-violet-500" />
        {!hideHeader && (
          <div className="relative px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100">
            <p className="admin-eyebrow">Student finder</p>
            <h2 className="admin-section-title text-base">Filter by performance & activity</h2>
            <p className="admin-section-desc text-sm">
              Combine filters to find inactive or underperforming students.
            </p>
          </div>
        )}

        <div className="relative px-4 sm:px-5 py-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick presets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:border-brand-300 hover:bg-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex p-0.5 rounded-lg bg-slate-50 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMatchMode('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    matchMode === 'all' ? 'bg-brand-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Match all
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode('any')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    matchMode === 'any' ? 'bg-brand-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Match any
                </button>
              </div>
              <span className="text-xs text-slate-500">
                {enabledCount} filter{enabledCount !== 1 ? 's' : ''} on
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {filtersOpen ? 'Hide filters' : 'Show filters'}
            </button>
          </div>

          {filtersOpen && (
            <div className="grid sm:grid-cols-2 gap-2.5">
            <FilterToggle
              enabled={filters.inactive.enabled}
              onChange={(v) => setFilter('inactive', { enabled: v })}
              title="Inactive (no submissions)"
              description="No LeetCode submissions in the last N days"
            >
              <span className="text-xs text-slate-500">Days</span>
              <input
                type="number"
                min={1}
                className="input w-20 py-1 text-sm"
                value={filters.inactive.days}
                onChange={(e) => setFilter('inactive', { days: Number(e.target.value) })}
              />
            </FilterToggle>

            <FilterToggle
              enabled={filters.lowSolvesInPeriod.enabled}
              onChange={(v) => setFilter('lowSolvesInPeriod', { enabled: v })}
              title="Low solves in period"
              description="Solved fewer than X unique problems in the time window"
            >
              <span className="text-xs text-slate-500">Fewer than</span>
              <input
                type="number"
                min={0}
                className="input w-16 py-1 text-sm"
                value={filters.lowSolvesInPeriod.fewerThan}
                onChange={(e) =>
                  setFilter('lowSolvesInPeriod', { fewerThan: Number(e.target.value) })
                }
              />
              <span className="text-xs text-slate-500">in</span>
              <select
                className="input w-28 py-1 text-sm"
                value={filters.lowSolvesInPeriod.period}
                onChange={(e) => setFilter('lowSolvesInPeriod', { period: e.target.value })}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="days">Custom days</option>
              </select>
              {filters.lowSolvesInPeriod.period === 'days' && (
                <input
                  type="number"
                  min={1}
                  className="input w-16 py-1 text-sm"
                  value={filters.lowSolvesInPeriod.days}
                  onChange={(e) =>
                    setFilter('lowSolvesInPeriod', { days: Number(e.target.value) })
                  }
                />
              )}
            </FilterToggle>

            <FilterToggle
              enabled={filters.noRecentActivity.enabled}
              onChange={(v) => setFilter('noRecentActivity', { enabled: v })}
              title="No recent activity"
              description="Last submission was N+ days ago (or never)"
            >
              <span className="text-xs text-slate-500">Days since last active ≥</span>
              <input
                type="number"
                min={1}
                className="input w-20 py-1 text-sm"
                value={filters.noRecentActivity.days}
                onChange={(e) => setFilter('noRecentActivity', { days: Number(e.target.value) })}
              />
            </FilterToggle>

            <FilterToggle
              enabled={filters.lowMastery.enabled}
              onChange={(v) => setFilter('lowMastery', { enabled: v })}
              title="Low topic mastery"
              description="Average mastery below threshold %"
            >
              <span className="text-xs text-slate-500">Below</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input w-16 py-1 text-sm"
                value={filters.lowMastery.below}
                onChange={(e) => setFilter('lowMastery', { below: Number(e.target.value) })}
              />
              <span className="text-xs text-slate-500">%</span>
            </FilterToggle>

            <FilterToggle
              enabled={filters.lowStreak.enabled}
              onChange={(v) => setFilter('lowStreak', { enabled: v })}
              title="Low streak"
              description="Current day streak below threshold"
            >
              <span className="text-xs text-slate-500">Streak below</span>
              <input
                type="number"
                min={0}
                className="input w-16 py-1 text-sm"
                value={filters.lowStreak.below}
                onChange={(e) => setFilter('lowStreak', { below: Number(e.target.value) })}
              />
              <span className="text-xs text-slate-500">days</span>
            </FilterToggle>

            <FilterToggle
              enabled={filters.belowClassAverage.enabled}
              onChange={(v) => setFilter('belowClassAverage', { enabled: v })}
              title="Below class average"
              description="Metric falls under % of classroom average"
            >
              <select
                className="input w-32 py-1 text-sm"
                value={filters.belowClassAverage.metric}
                onChange={(e) => setFilter('belowClassAverage', { metric: e.target.value })}
              >
                <option value="totalSolved">Solved</option>
                <option value="mastery">Mastery</option>
                <option value="weeklyActivity">Weekly</option>
                <option value="streak">Streak</option>
              </select>
              <span className="text-xs text-slate-500">below</span>
              <input
                type="number"
                min={1}
                max={100}
                className="input w-16 py-1 text-sm"
                value={filters.belowClassAverage.percentOfClassAvg}
                onChange={(e) =>
                  setFilter('belowClassAverage', { percentOfClassAvg: Number(e.target.value) })
                }
              />
              <span className="text-xs text-slate-500">% of avg</span>
            </FilterToggle>

            <FilterToggle
              enabled={filters.syncIssue.enabled}
              onChange={(v) => setFilter('syncIssue', { enabled: v })}
              title="Sync issues"
              description="Missing snapshot or LeetCode sync error"
            />
          </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <input
              className="input max-w-full sm:max-w-xs text-sm py-2 flex-1 min-w-0"
              placeholder="Search name, institute, dept, mobile…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={runFilter}
              disabled={loading || enabledCount === 0}
              className="btn-primary text-sm py-2 disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Find students'}
            </button>
            <button type="button" onClick={resetFilters} className="btn-secondary text-sm py-2">
              Reset
            </button>
            {error && <span className="text-red-600 text-sm font-medium">{error}</span>}
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm">
                {result.matchCount} student{result.matchCount !== 1 ? 's' : ''} matched
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Scanned {result.totalScanned} · Avg solved {result.classAverages?.totalSolved ?? '—'} ·
                mastery {result.classAverages?.avgMastery ?? '—'}%
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {matchMode === 'any' ? 'Match ANY' : 'Match ALL'}
            </span>
          </div>

          {!matchedRows.length ? (
            <p className="text-slate-500 text-sm text-center py-10">No students match these filters</p>
          ) : (
            <>
              <div
                className={`overflow-x-auto ${resultsExpanded ? 'max-h-[min(440px,55vh)] overflow-y-auto' : ''}`}
              >
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgb(226,232,240)]">
                    <tr className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                      <th className="text-left py-2.5 pl-4 sm:pl-5 pr-2">Student</th>
                      <th className="text-left py-2.5 pr-2 hidden lg:table-cell">Institute</th>
                      <th className="text-left py-2.5 pr-2 hidden lg:table-cell">Department</th>
                      <th className="text-left py-2.5 pr-2 hidden xl:table-cell">Mobile</th>
                      <th className="text-left py-2.5 pr-2 hidden md:table-cell">Division</th>
                      <th className="text-center py-2.5 pr-2">Rank</th>
                      <th className="text-right py-2.5 pr-2">Solved</th>
                      <th className="text-right py-2.5 pr-2 hidden sm:table-cell">7d</th>
                      <th className="text-left py-2.5 pr-4 sm:pr-5 min-w-[140px]">Why matched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((s) => (
                      <tr key={s.studentId} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-2 pl-4 sm:pl-5 pr-2 min-w-0">
                          <Link
                            to={`/c/${classroomSlug}/student/${s.studentId}`}
                            target="_blank"
                            className="font-semibold text-slate-900 hover:text-brand-600 truncate block text-sm"
                          >
                            {s.displayName}
                          </Link>
                          <span className="text-slate-500 text-xs block truncate">@{s.leetcodeUsername}</span>
                          <StudentAdminMeta student={s} className="lg:hidden" />
                        </td>
                        <td className="py-2 pr-2 text-slate-600 text-xs hidden lg:table-cell max-w-[120px] truncate">
                          {s.institute || '—'}
                        </td>
                        <td className="py-2 pr-2 text-slate-600 text-xs hidden lg:table-cell max-w-[120px] truncate">
                          {s.academicDepartment || '—'}
                        </td>
                        <td className="py-2 pr-2 text-slate-600 text-xs hidden xl:table-cell tabular-nums">
                          {s.mobile || '—'}
                        </td>
                        <td className="py-2 pr-2 text-slate-500 text-xs hidden md:table-cell">
                          {s.division?.name || '—'}
                        </td>
                        <td className="py-2 pr-2 text-center">
                          {s.overallRank ? <RankBadge rank={s.overallRank} size="sm" /> : '—'}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums font-semibold">{s.metrics.totalSolved}</td>
                        <td className="py-2 pr-2 text-right tabular-nums text-slate-500 hidden sm:table-cell">
                          {s.metrics.solvesLast7Days}
                        </td>
                        <td className="py-2 pr-4 sm:pr-5">
                          <p className="text-xs text-amber-800 leading-snug line-clamp-2">
                            {s.matchedReasons.join(' · ')}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {matchedRows.length > RESULT_PREVIEW && (
                <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {resultsExpanded
                      ? `Showing all ${matchedRows.length}`
                      : `Showing ${RESULT_PREVIEW} of ${matchedRows.length}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setResultsExpanded(!resultsExpanded)}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {resultsExpanded ? 'Show less' : `View all ${matchedRows.length}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
