export function studentAdminSearchText(student = {}) {
  return [
    student.displayName,
    student.leetcodeUsername,
    student.email,
    student.enrollmentNumber,
    student.institute,
    student.academicDepartment,
    student.mobile,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesStudentAdminSearch(student, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return studentAdminSearchText(student).includes(q);
}

export default function StudentAdminMeta({ student, inline = true, className = '' }) {
  const institute = student?.institute?.trim();
  const department = student?.academicDepartment?.trim();
  const mobile = student?.mobile?.trim();

  if (!institute && !department && !mobile) return null;

  if (inline) {
    const parts = [institute, department, mobile].filter(Boolean);
    return (
      <span className={`text-[11px] text-slate-500 block truncate ${className}`}>{parts.join(' · ')}</span>
    );
  }

  return (
    <div className={`space-y-0.5 ${className}`}>
      {institute ? (
        <span className="text-[11px] text-slate-500 block truncate">
          <span className="text-slate-400">Institute:</span> {institute}
        </span>
      ) : null}
      {department ? (
        <span className="text-[11px] text-slate-500 block truncate">
          <span className="text-slate-400">Dept:</span> {department}
        </span>
      ) : null}
      {mobile ? (
        <span className="text-[11px] text-slate-500 block truncate">
          <span className="text-slate-400">Mobile:</span> {mobile}
        </span>
      ) : null}
    </div>
  );
}
