import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSection from './AdminSection';
import StudentAdminMeta, { matchesStudentAdminSearch } from './StudentAdminMeta';

export default function StudentsRoster({
  students,
  divisions,
  classroomSlug,
  onRemove,
  onEdit,
  onGoBulk,
  headerAction,
}) {
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filtered = useMemo(() => {
    let list = students.filter((s) => s.status === 'active');
    if (divisionFilter) {
      list = list.filter((s) => String(s.divisionId?._id) === divisionFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => matchesStudentAdminSearch(s, q));
    }
    const sorters = {
      name: (a, b) => a.displayName.localeCompare(b.displayName),
      solved: (a, b) => (b.snapshot?.totalSolved ?? 0) - (a.snapshot?.totalSolved ?? 0),
      streak: (a, b) => (b.snapshot?.streak ?? 0) - (a.snapshot?.streak ?? 0),
    };
    return [...list].sort(sorters[sortBy] || sorters.name);
  }, [students, search, divisionFilter, sortBy]);

  return (
    <AdminSection
      eyebrow="Roster"
      title={`Active students (${filtered.length})`}
      subtitle="Search and manage enrolled students. Sync from the header to refresh stats."
      accent="violet"
      delay={0.05}
      noPadding
      headerAction={headerAction}
    >
      <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-3 border-b border-slate-100">
        <input
          className="input max-w-xs text-sm flex-1 min-w-[180px]"
          placeholder="Search name, institute, dept, mobile, enrollment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input text-sm max-w-[160px] py-2"
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
        >
          <option value="">All divisions</option>
          {divisions.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className="input text-sm max-w-[140px] py-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort: Name</option>
          <option value="solved">Sort: Solved</option>
          <option value="streak">Sort: Streak</option>
        </select>
      </div>

      <div className="overflow-x-auto max-h-[min(480px,60vh)]">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgb(226,232,240)]">
            <tr className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <th className="text-left py-3 pl-4 sm:pl-6 pr-2 min-w-[140px]">Student</th>
              <th className="text-left py-3 pr-2 hidden lg:table-cell">Institute</th>
              <th className="text-left py-3 pr-2 hidden lg:table-cell">Department</th>
              <th className="text-left py-3 pr-2 hidden xl:table-cell">Mobile</th>
              <th className="text-left py-3 pr-2 hidden md:table-cell">Enrollment</th>
              <th className="text-left py-3 pr-2 hidden sm:table-cell">Division</th>
              <th className="text-right py-3 pr-2">Solved</th>
              <th className="text-right py-3 pr-2 hidden md:table-cell">Streak</th>
              <th className="text-center py-3 pr-2 hidden lg:table-cell">Status</th>
              <th className="text-right py-3 pr-4 sm:pr-6 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const snap = s.snapshot;
              const hasError = snap?.syncError;
              const noData = !snap;
              return (
                <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-4 sm:pl-6 pr-2 min-w-0">
                    <Link
                      to={`/c/${classroomSlug}/student/${s._id}`}
                      target="_blank"
                      className="font-bold text-slate-900 hover:text-brand-600 transition-colors truncate block max-w-[180px] sm:max-w-none"
                    >
                      {s.displayName}
                    </Link>
                    <span className="text-slate-500 text-xs block truncate">@{s.leetcodeUsername}</span>
                    {s.email ? (
                      <span className="text-slate-400 text-[11px] block truncate">{s.email}</span>
                    ) : null}
                    <StudentAdminMeta student={s} className="lg:hidden" />
                  </td>
                  <td className="py-3 pr-2 hidden lg:table-cell text-xs text-slate-600 max-w-[140px] truncate">
                    {s.institute || '—'}
                  </td>
                  <td className="py-3 pr-2 hidden lg:table-cell text-xs text-slate-600 max-w-[140px] truncate">
                    {s.academicDepartment || '—'}
                  </td>
                  <td className="py-3 pr-2 hidden xl:table-cell text-xs text-slate-600 tabular-nums">
                    {s.mobile || '—'}
                  </td>
                  <td className="py-3 pr-2 hidden md:table-cell font-mono text-xs text-slate-600">
                    {s.enrollmentNumber || '—'}
                  </td>
                  <td className="py-3 pr-2 hidden sm:table-cell">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {s.divisionId?.name || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right font-black text-slate-800 tabular-nums">
                    {noData ? '—' : hasError ? '!' : snap.totalSolved ?? 0}
                  </td>
                  <td className="py-3 pr-2 text-right tabular-nums text-amber-600 font-semibold hidden md:table-cell">
                    {snap?.streak != null ? `${snap.streak}d` : '—'}
                  </td>
                  <td className="py-3 pr-2 text-center hidden lg:table-cell">
                    {hasError ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                        Sync error
                      </span>
                    ) : noData ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        Not synced
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 sm:pr-6 text-right">
                    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(s)}
                          className="text-xs font-semibold text-slate-700 hover:text-brand-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      <Link
                        to={`/c/${classroomSlug}/student/${s._id}`}
                        target="_blank"
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Profile ↗
                      </Link>
                      <button
                        type="button"
                        onClick={() => onRemove(s._id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filtered.length && (
        <div className="text-center py-14 px-6">
          <p className="text-slate-700 font-semibold">No students match your filters</p>
          <p className="text-slate-500 text-sm mt-1">Try clearing search or add students below</p>
          {onGoBulk && (
            <button type="button" onClick={onGoBulk} className="btn-secondary text-sm mt-4">
              Bulk enrollment →
            </button>
          )}
        </div>
      )}
    </AdminSection>
  );
}
