import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminStatCard from './AdminStatCard';

function MetricTable({ title, subtitle, columns, rows, onRowClick, emptyMessage }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {!rows?.length ? (
        <p className="text-sm text-slate-500 text-center py-8">{emptyMessage || 'No data in scope'}</p>
      ) : (
        <div className="max-h-[min(360px,50vh)] overflow-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2 px-3 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.hideSm ? 'hidden sm:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row._key}
                  className={`border-b border-slate-100 ${onRowClick ? 'cursor-pointer hover:bg-brand-50/50' : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2 px-3 ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.hideSm ? 'hidden sm:table-cell' : ''} ${col.bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HierarchyTree({ hierarchy, showFaculty }) {
  const [openFaculty, setOpenFaculty] = useState({});
  const [openDept, setOpenDept] = useState({});
  const [openInstructor, setOpenInstructor] = useState({});

  if (!hierarchy?.length) {
    return <p className="text-sm text-slate-500 text-center py-6">No hierarchy data in your scope.</p>;
  }

  return (
    <div className="space-y-2">
      {hierarchy.map((fac) => {
        const fKey = fac.facultyId || '_root';
        const facOpen = openFaculty[fKey];
        return (
          <div key={fKey} className="rounded-xl border border-violet-200 bg-violet-50/20 overflow-hidden">
            {showFaculty && (
              <button
                type="button"
                className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-violet-50/60"
                onClick={() => setOpenFaculty((s) => ({ ...s, [fKey]: !facOpen }))}
              >
                <div>
                  <p className="font-semibold text-slate-900">{fac.facultyName}</p>
                  <p className="text-xs text-slate-500">Faculty · {fac.departments?.length || 0} departments</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs tabular-nums text-slate-600">
                  <span>{fac.classrooms} classrooms</span>
                  <span>{fac.students} students</span>
                  <span className="font-semibold text-brand-700">avg {fac.avgSolved}</span>
                  <span>{fac.syncRate}% synced</span>
                </div>
              </button>
            )}

            {(!showFaculty || facOpen) && (
              <div className={`space-y-2 ${showFaculty ? 'px-3 pb-3' : 'p-3'}`}>
                {(fac.departments || []).map((dept) => {
                  const dKey = dept.departmentId;
                  const deptOpen = openDept[dKey];
                  return (
                    <div key={dKey} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
                        onClick={() => setOpenDept((s) => ({ ...s, [dKey]: !deptOpen }))}
                      >
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{dept.departmentName}</p>
                          <p className="text-xs text-slate-500">
                            {(dept.instructors || []).length} instructors · {dept.classrooms} classrooms
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs tabular-nums text-slate-600">
                          <span>{dept.students} students</span>
                          <span className="font-semibold text-brand-700">avg {dept.avgSolved}</span>
                        </div>
                      </button>

                      {deptOpen && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {(dept.instructors || []).map((inst) => {
                            const iKey = inst.instructorId;
                            const instOpen = openInstructor[iKey];
                            return (
                              <div key={iKey}>
                                <button
                                  type="button"
                                  className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-left hover:bg-slate-50/80"
                                  onClick={() => setOpenInstructor((s) => ({ ...s, [iKey]: !instOpen }))}
                                >
                                  <p className="text-sm font-medium text-slate-800">{inst.instructorName}</p>
                                  <div className="flex gap-2 text-xs tabular-nums text-slate-500">
                                    <span>{inst.classrooms?.length ?? 0} classes</span>
                                    <span>{inst.students} students</span>
                                    <span className="font-semibold text-slate-700">avg {inst.avgSolved}</span>
                                  </div>
                                </button>
                                {instOpen && (
                                  <div className="px-4 pb-3 space-y-1">
                                    {(Array.isArray(inst.classrooms) ? inst.classrooms : []).map((c) => (
                                      <div
                                        key={c.classroomId}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                                      >
                                        <div className="min-w-0">
                                          <p className="font-medium text-slate-800 truncate">{c.name}</p>
                                          <p className="text-slate-500">
                                            {c.students} students · sync {c.syncRate}%
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 tabular-nums">
                                          <span className="font-semibold text-brand-700">{c.avgSolved} avg</span>
                                          <Link
                                            to={`/admin/classrooms/${c.classroomId}`}
                                            className="text-brand-600 font-semibold hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Manage →
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrgAnalyticsView({
  analytics,
  loading,
  myRole,
  isUniversityAdmin,
  faculties = [],
  myDepartments = [],
  instructorsInScope = [],
  filters,
  onFiltersChange,
  onRefresh,
}) {
  const scope = analytics?.scope;
  const showFacultyLevel =
    scope?.level === 'university' ||
    (myRole === 'org_admin' && isUniversityAdmin) ||
    scope?.role === 'super_admin';

  const showDepartmentLevel = scope?.level !== 'instructor';
  const showInstructorLevel = true;

  const deptColumns = useMemo(
    () => [
      { key: 'departmentName', label: 'Department', bold: true },
      { key: 'facultyName', label: 'Faculty', hideSm: !showFacultyLevel },
      { key: 'classrooms', label: 'Classes', align: 'right' },
      { key: 'instructors', label: 'Instructors', align: 'right', hideSm: true },
      { key: 'students', label: 'Students', align: 'right' },
      { key: 'avgSolved', label: 'Avg solved', align: 'right', bold: true },
      { key: 'syncRate', label: 'Sync %', align: 'right', hideSm: true },
    ],
    [showFacultyLevel]
  );

  const facultyColumns = [
    { key: 'facultyName', label: 'Faculty', bold: true },
    { key: 'classrooms', label: 'Classes', align: 'right' },
    { key: 'students', label: 'Students', align: 'right' },
    { key: 'avgSolved', label: 'Avg solved', align: 'right', bold: true },
    { key: 'syncRate', label: 'Sync %', align: 'right' },
  ];

  const instructorColumns = [
    { key: 'instructorName', label: 'Instructor', bold: true },
    { key: 'departmentName', label: 'Department', hideSm: scope?.level === 'department' },
    { key: 'classrooms', label: 'Classes', align: 'right' },
    { key: 'students', label: 'Students', align: 'right' },
    { key: 'avgSolved', label: 'Avg solved', align: 'right', bold: true },
    { key: 'syncRate', label: 'Sync %', align: 'right', hideSm: true },
  ];

  const classroomColumns = [
    { key: 'name', label: 'Classroom', bold: true },
    { key: 'departmentName', label: 'Department', hideSm: scope?.level === 'department' },
    { key: 'instructorName', label: 'Instructor', hideSm: scope?.level === 'instructor' },
    { key: 'students', label: 'Students', align: 'right' },
    { key: 'avgSolved', label: 'Avg', align: 'right', bold: true },
    { key: 'avgStreak', label: 'Streak', align: 'right', hideSm: true },
    {
      key: 'link',
      label: '',
      align: 'right',
      render: (row) => (
        <Link to={`/admin/classrooms/${row.classroomId}`} className="text-brand-600 font-semibold hover:underline">
          Open
        </Link>
      ),
    },
  ];

  const handleFacultyClick = (row) => {
    onFiltersChange((f) => ({
      ...f,
      facultyId: f.facultyId === row.facultyId ? '' : row.facultyId,
      departmentId: '',
      instructorId: '',
    }));
  };

  const handleDeptClick = (row) => {
    onFiltersChange((f) => ({
      ...f,
      departmentId: f.departmentId === row.departmentId ? '' : row.departmentId,
      instructorId: '',
    }));
  };

  const handleInstructorClick = (row) => {
    onFiltersChange((f) => ({
      ...f,
      instructorId: f.instructorId === row.instructorId ? '' : row.instructorId,
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading analytics…</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-slate-500 text-sm">No analytics data yet.</div>;
  }

  const { summary, comparisons, hierarchy } = analytics;
  const activeFilterCount = [filters.facultyId, filters.departmentId, filters.instructorId].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {scope?.label && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Your analytics scope</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{scope.label}</p>
          <p className="text-xs text-slate-600 mt-1">
            {showFacultyLevel && 'Compare faculties, drill into departments, instructors, and classrooms. '}
            {scope?.level === 'faculty' && 'Compare all departments under your faculty. '}
            {scope?.level === 'department' && 'Compare instructors and classrooms in your department(s). '}
            {scope?.level === 'instructor' && 'Performance across your assigned classrooms.'}
          </p>
        </div>
      )}

      <div className="px-1 flex flex-wrap gap-2 items-center">
        {showFacultyLevel && (
          <select
            className="input text-sm py-2 max-w-[170px]"
            value={filters.facultyId}
            onChange={(e) =>
              onFiltersChange((f) => ({ ...f, facultyId: e.target.value, departmentId: '', instructorId: '' }))
            }
          >
            <option value="">All faculties</option>
            {faculties.map((f) => (
              <option key={f._id} value={String(f._id)}>
                {f.name}
              </option>
            ))}
          </select>
        )}
        {showDepartmentLevel && (
          <select
            className="input text-sm py-2 max-w-[170px]"
            value={filters.departmentId}
            onChange={(e) => onFiltersChange((f) => ({ ...f, departmentId: e.target.value, instructorId: '' }))}
          >
            <option value="">All departments</option>
            {myDepartments
              .filter((d) => (filters.facultyId ? String(d.parentId) === filters.facultyId : true))
              .map((d) => (
                <option key={d._id} value={String(d._id)}>
                  {d.name}
                </option>
              ))}
          </select>
        )}
        {showInstructorLevel && instructorsInScope.length > 0 && (
          <select
            className="input text-sm py-2 max-w-[170px]"
            value={filters.instructorId}
            onChange={(e) => onFiltersChange((f) => ({ ...f, instructorId: e.target.value }))}
          >
            <option value="">All instructors</option>
            {instructorsInScope.map((m) => (
              <option key={m._id} value={String(m.userId?._id)}>
                {m.userId?.name}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="btn-secondary text-sm" onClick={onRefresh}>
          Refresh
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="text-xs font-semibold text-brand-600 hover:underline"
            onClick={() => onFiltersChange({ facultyId: '', departmentId: '', instructorId: '', search: '' })}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-1">
        {showFacultyLevel && (
          <AdminStatCard label="Faculties" value={summary.faculties ?? '—'} accent="violet" compact />
        )}
        <AdminStatCard label="Departments" value={summary.departments} accent="violet" compact />
        <AdminStatCard label="Instructors" value={summary.instructors} accent="sky" compact />
        <AdminStatCard label="Classrooms" value={summary.classrooms} accent="brand" compact />
        <AdminStatCard label="Students" value={summary.students} accent="emerald" compact />
        <AdminStatCard label="Avg solved" value={summary.avgSolvedOverall} accent="amber" compact />
        <AdminStatCard label="Sync rate" value={`${summary.syncRateOverall ?? 0}%`} accent="slate" compact />
      </div>

      {showFacultyLevel && comparisons.byFaculty?.length > 0 && (
        <MetricTable
          title="Faculty comparison"
          subtitle="Click a row to filter departments under that faculty"
          columns={facultyColumns}
          rows={comparisons.byFaculty.map((r) => ({ ...r, _key: r.facultyId }))}
          onRowClick={handleFacultyClick}
          emptyMessage="No faculties in scope"
        />
      )}

      {showDepartmentLevel && (
        <MetricTable
          title={scope?.level === 'department' ? 'Your departments' : 'Department comparison'}
          subtitle="Click a row to filter instructors and classrooms in that department"
          columns={deptColumns}
          rows={comparisons.byDepartment.map((r) => ({ ...r, _key: r.departmentId }))}
          onRowClick={scope?.level !== 'instructor' ? handleDeptClick : undefined}
        />
      )}

      <MetricTable
        title="Instructor comparison"
        subtitle="Click a row to see that instructor's classrooms below"
        columns={instructorColumns}
        rows={comparisons.byInstructor.map((r) => ({ ...r, _key: r.instructorId }))}
        onRowClick={scope?.level !== 'instructor' ? handleInstructorClick : undefined}
      />

      <MetricTable
        title="All classrooms in scope"
        subtitle="Every classroom you can access — open for full student insights"
        columns={classroomColumns}
        rows={comparisons.byClassroom.map((r) => ({ ...r, _key: r.classroomId }))}
      />

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-800">Hierarchy drill-down</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Expand each level to see everything below you — faculty → department → instructor → classroom
          </p>
        </div>
        <div className="p-4">
          <HierarchyTree hierarchy={hierarchy} showFaculty={showFacultyLevel && (hierarchy?.length > 1 || hierarchy?.[0]?.facultyId)} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-sm font-semibold text-emerald-900 mb-2">Top performing classrooms</p>
          <ul className="space-y-1.5 max-h-52 overflow-auto">
            {comparisons.topClassrooms.map((c) => (
              <li key={c.classroomId} className="text-sm flex justify-between gap-2 items-center">
                <span className="truncate">
                  {c.name}
                  <span className="text-slate-500 text-xs ml-1">· {c.departmentName}</span>
                </span>
                <span className="font-semibold tabular-nums shrink-0">{c.avgSolved}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">Needs attention</p>
          <ul className="space-y-1.5 max-h-52 overflow-auto">
            {comparisons.needsAttention.map((c) => (
              <li key={c.classroomId} className="text-sm flex justify-between gap-2 items-center">
                <span className="truncate">
                  {c.name}
                  <span className="text-slate-500 text-xs ml-1">· {c.instructorName}</span>
                </span>
                <span className="font-semibold tabular-nums shrink-0">{c.avgSolved}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
