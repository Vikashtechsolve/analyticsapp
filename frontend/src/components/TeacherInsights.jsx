import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSection from './admin/AdminSection';
import TopicWeaknessTable from './admin/TopicWeaknessTable';
import StudentAdminMeta, { matchesStudentAdminSearch } from './admin/StudentAdminMeta';

const PREVIEW_LIMIT = 8;

function masteryTone(pct) {
  if (pct < 40) return 'text-red-600';
  if (pct < 60) return 'text-amber-600';
  return 'text-emerald-600';
}

function StudentPanel({
  students,
  classroomSlug,
  columns,
  previewLimit = PREVIEW_LIMIT,
  emptyMessage = 'None in this category',
  emptyPositive = false,
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students || [];
    return (students || []).filter((s) => matchesStudentAdminSearch(s, q));
  }, [students, search]);

  const visible = expanded ? filtered : filtered.slice(0, previewLimit);
  const profile = (id) => `/c/${classroomSlug}/student/${id}`;

  if (!students?.length) {
    return (
      <div
        className={`text-center py-8 rounded-xl border ${
          emptyPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-dashed border-slate-200'
        }`}
      >
        <p className={`font-semibold text-sm ${emptyPositive ? 'text-emerald-700' : 'text-slate-500'}`}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          className="input text-sm py-1.5 flex-1 min-w-0 sm:min-w-[140px] max-w-full sm:max-w-xs"
          placeholder="Search name, institute, dept, mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-xs text-slate-500 tabular-nums">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        className={`rounded-xl border border-slate-200 overflow-hidden ${
          expanded ? 'max-h-[min(420px,55vh)]' : ''
        }`}
      >
        <div className={expanded ? 'overflow-x-auto overflow-y-auto max-h-[min(420px,55vh)]' : 'overflow-x-auto'}>
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(226,232,240)]">
              <tr className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2.5 px-3 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.hideSm ? 'hidden sm:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.studentId} className="border-t border-slate-100 hover:bg-slate-50/80">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2 px-3 ${col.align === 'right' ? 'text-right' : ''} ${col.hideSm ? 'hidden sm:table-cell' : ''}`}
                    >
                      {col.render(s, profile)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > previewLimit && (
        <div className="flex items-center justify-between mt-2.5 px-0.5">
          <span className="text-xs text-slate-500">
            {expanded
              ? `Showing all ${filtered.length}`
              : `Showing ${Math.min(previewLimit, filtered.length)} of ${filtered.length}`}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            {expanded ? 'Show less' : `View all ${filtered.length}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TeacherInsights({ insights, classroomSlug }) {
  const [dailySort, setDailySort] = useState('submissions');
  const [dailyFilter, setDailyFilter] = useState('active');
  const [dailySearch, setDailySearch] = useState('');
  const [dailyExpanded, setDailyExpanded] = useState(false);

  const sortedDaily = useMemo(() => {
    if (!insights?.dailyReport) return [];
    let list = [...insights.dailyReport];
    if (dailyFilter === 'active') list = list.filter((d) => d.submissionsToday > 0);
    if (dailyFilter === 'inactive') list = list.filter((d) => d.submissionsToday === 0);
    const q = dailySearch.trim().toLowerCase();
    if (q) list = list.filter((d) => matchesStudentAdminSearch(d, q));
    if (dailySort === 'submissions') {
      return list.sort((a, b) => b.submissionsToday - a.submissionsToday);
    }
    if (dailySort === 'streak') {
      return list.sort((a, b) => b.streak - a.streak);
    }
    return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [insights?.dailyReport, dailySort, dailyFilter, dailySearch]);

  const dailyVisible = dailyExpanded ? sortedDaily : sortedDaily.slice(0, PREVIEW_LIMIT);

  if (!insights) {
    return (
      <AdminSection
        eyebrow="Insights"
        title="No analytics yet"
        subtitle="Sync LeetCode data to unlock batch insights, at-risk alerts, and daily reports."
        accent="slate"
      >
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-slate-800 font-semibold">Waiting for sync data</p>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Use <strong>Sync LeetCode</strong> in the header after enrolling students.
          </p>
        </div>
      </AdminSection>
    );
  }

  const {
    topPerformers,
    strugglingStudents,
    atRiskStudents,
    consistentStudents,
    topicClassMastery,
    batchProgress,
  } = insights;

  const profile = (id) => `/c/${classroomSlug}/student/${id}`;

  const nameCol = {
    key: 'name',
    label: 'Student',
    render: (s, p) => (
      <div className="min-w-0">
        <Link
          to={p(s.studentId)}
          target="_blank"
          className="font-semibold text-slate-900 hover:text-brand-600 truncate block max-w-[160px]"
        >
          {s.displayName}
        </Link>
        <StudentAdminMeta student={s} />
      </div>
    ),
  };

  const masteryCol = {
    key: 'mastery',
    label: 'Mastery',
    align: 'right',
    render: (s) => (
      <span className={`font-bold tabular-nums ${masteryTone(s.avgMastery)}`}>{s.avgMastery}%</span>
    ),
  };

  return (
    <div className="space-y-4">
      {(atRiskStudents?.length > 0 || strugglingStudents?.length > 0) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">At risk</p>
            <p className="text-xl font-black text-rose-800 tabular-nums">{atRiskStudents?.length || 0}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Struggling</p>
            <p className="text-xl font-black text-amber-900 tabular-nums">{strugglingStudents?.length || 0}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Consistent</p>
            <p className="text-xl font-black text-emerald-900 tabular-nums">{consistentStudents?.length || 0}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Active today</p>
            <p className="text-xl font-black text-sky-900 tabular-nums">{batchProgress?.activeToday ?? 0}</p>
          </div>
        </div>
      )}

      <AdminSection
        eyebrow="Leaders"
        title="Top performers"
        subtitle="Top 5 by topic mastery"
        accent="amber"
        delay={0.03}
      >
        {topPerformers?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {topPerformers.map((s, i) => (
              <Link
                key={s.studentId}
                to={profile(s.studentId)}
                target="_blank"
                className={`rounded-xl border p-3 transition-all hover:shadow-sm min-w-0 ${
                  i === 0 ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white hover:border-brand-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                      i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{s.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">@{s.leetcodeUsername}</p>
                    <StudentAdminMeta student={s} />
                  </div>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="font-black text-brand-600">{s.avgMastery}%</span>
                  <span className="text-slate-600 tabular-nums">{s.totalSolved} solved</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">No ranked students yet</p>
        )}
      </AdminSection>

      <div className="grid lg:grid-cols-2 gap-4">
        <AdminSection
          eyebrow="Support"
          title="Struggling students"
          subtitle="Below 40% mastery or under 60% of class average"
          accent="rose"
          delay={0.05}
        >
          <StudentPanel
            students={strugglingStudents}
            classroomSlug={classroomSlug}
            emptyMessage="No struggling students flagged"
            emptyPositive
            columns={[
              nameCol,
              masteryCol,
              {
                key: 'topics',
                label: 'Weak topics',
                hideSm: true,
                render: (s) => (
                  <span className="text-xs text-slate-500 truncate block max-w-[180px]">
                    {s.weakTopics?.length ? s.weakTopics.join(', ') : '—'}
                  </span>
                ),
              },
            ]}
          />
        </AdminSection>

        <AdminSection
          eyebrow="Alerts"
          title="At-risk students"
          subtitle="Inactive with low progress or streak"
          accent="rose"
          delay={0.08}
        >
          <StudentPanel
            students={atRiskStudents}
            classroomSlug={classroomSlug}
            emptyMessage="Class looks healthy"
            emptyPositive
            columns={[
              nameCol,
              masteryCol,
              {
                key: 'reason',
                label: 'Reason',
                hideSm: true,
                render: (s) => <span className="text-xs text-slate-500">{s.reason}</span>,
              },
            ]}
          />
        </AdminSection>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <AdminSection
          eyebrow="Consistency"
          title="Most consistent"
          subtitle="5+ day streak and 5+ submissions this week"
          accent="emerald"
          delay={0.05}
        >
          {consistentStudents?.length ? (
            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-auto">
              {consistentStudents.map((s) => (
                <Link
                  key={s.studentId}
                  to={profile(s.studentId)}
                  target="_blank"
                  className="flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 hover:border-emerald-200 min-w-0"
                >
                  <span className="font-semibold text-slate-900 text-sm truncate">{s.displayName}</span>
                  <span className="text-[11px] font-bold text-emerald-700 tabular-nums shrink-0">
                    {s.streak}d · {s.weeklyActivity}/wk
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No highly consistent students yet</p>
          )}
        </AdminSection>

        <AdminSection
          eyebrow="Curriculum"
          title="Weakest class topics"
          subtitle="Focus teaching on lowest mastery topics"
          accent="violet"
          delay={0.05}
          noPadding
        >
          <div className="px-4 sm:px-5 pb-4">
            <TopicWeaknessTable topics={topicClassMastery} limit={8} />
          </div>
        </AdminSection>
      </div>

      <AdminSection
        eyebrow="Today"
        title="Daily activity report"
        subtitle={`${batchProgress?.activeToday ?? 0} of ${batchProgress?.totalStudents ?? 0} solved a problem today`}
        accent="sky"
        delay={0.08}
        noPadding
        headerAction={
          <select
            className="input text-sm py-1.5 w-full sm:w-[10rem]"
            value={dailySort}
            onChange={(e) => setDailySort(e.target.value)}
            aria-label="Sort daily report"
          >
            <option value="submissions">By submissions</option>
            <option value="streak">By streak</option>
            <option value="name">By name</option>
          </select>
        }
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {[
              { id: 'active', label: 'Active today' },
              { id: 'inactive', label: 'Inactive' },
              { id: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setDailyFilter(f.id);
                  setDailyExpanded(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  dailyFilter === f.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="input text-sm py-1.5 flex-1 min-w-0 sm:min-w-[140px] max-w-full sm:max-w-xs"
            placeholder="Search student, institute, dept, mobile…"
            value={dailySearch}
            onChange={(e) => setDailySearch(e.target.value)}
          />
          <span className="text-xs text-slate-500 tabular-nums">{sortedDaily.length} rows</span>
        </div>

        <div className={`overflow-x-auto ${dailyExpanded ? 'max-h-[min(400px,50vh)] overflow-y-auto' : ''}`}>
          <table className="w-full text-sm min-w-[520px]">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgb(226,232,240)]">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="text-left py-2.5 pl-4 sm:pl-5 pr-2">Student</th>
                <th className="text-left py-2.5 pr-2 hidden lg:table-cell">Institute</th>
                <th className="text-left py-2.5 pr-2 hidden lg:table-cell">Department</th>
                <th className="text-right py-2.5 pr-4 sm:pr-5 w-16">Today</th>
                <th className="text-right py-2.5 pr-4 sm:pr-5 w-16">Streak</th>
              </tr>
            </thead>
            <tbody>
              {dailyVisible.length ? (
                dailyVisible.map((d) => (
                  <tr key={d.studentId} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="py-2 pl-4 sm:pl-5 pr-2 min-w-0">
                      <Link
                        to={profile(d.studentId)}
                        target="_blank"
                        className="font-semibold text-slate-900 hover:text-brand-600 truncate block max-w-[200px] sm:max-w-none text-sm"
                      >
                        {d.displayName}
                      </Link>
                      <StudentAdminMeta student={d} className="lg:hidden" />
                    </td>
                    <td className="py-2 pr-2 hidden lg:table-cell text-xs text-slate-600 max-w-[120px] truncate">
                      {d.institute || '—'}
                    </td>
                    <td className="py-2 pr-2 hidden lg:table-cell text-xs text-slate-600 max-w-[120px] truncate">
                      {d.academicDepartment || '—'}
                    </td>
                    <td
                      className={`py-2 pr-4 sm:pr-5 text-right font-bold tabular-nums text-sm ${
                        d.submissionsToday > 0 ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                    >
                      {d.submissionsToday}
                    </td>
                    <td className="py-2 pr-4 sm:pr-5 text-right tabular-nums text-amber-600 font-semibold text-sm">
                      {d.streak}d
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    No students match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sortedDaily.length > PREVIEW_LIMIT && (
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
            <span className="text-xs text-slate-500">
              {dailyExpanded
                ? `Showing all ${sortedDaily.length}`
                : `Showing ${PREVIEW_LIMIT} of ${sortedDaily.length}`}
            </span>
            <button
              type="button"
              onClick={() => setDailyExpanded(!dailyExpanded)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {dailyExpanded ? 'Show less' : `View all ${sortedDaily.length}`}
            </button>
          </div>
        )}
      </AdminSection>
    </div>
  );
}
