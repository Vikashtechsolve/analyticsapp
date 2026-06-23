import TeacherStudentFilter from '../TeacherStudentFilter';

export default function StudentFinderTab({
  classroomId,
  classroomSlug,
  divisions,
  divisionId,
  onDivisionChange,
}) {
  const scopeName = divisionId
    ? divisions.find((d) => d._id === divisionId)?.name || 'selected division'
    : 'all divisions';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-violet-500 to-purple-500" />
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="admin-eyebrow">Student Finder</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Find inactive or underperforming students in{' '}
              <span className="font-semibold text-slate-800">{scopeName}</span>
            </p>
          </div>
          <select
            className="input text-sm w-full sm:w-auto sm:min-w-[11rem] py-2 shrink-0"
            value={divisionId}
            onChange={(e) => onDivisionChange(e.target.value)}
            aria-label="Filter by division"
          >
            <option value="">All divisions</option>
            {divisions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TeacherStudentFilter
        classroomId={classroomId}
        classroomSlug={classroomSlug}
        divisions={divisions}
        divisionId={divisionId}
        hideHeader
      />
    </div>
  );
}
