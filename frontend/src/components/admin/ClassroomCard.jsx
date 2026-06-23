import { Link } from 'react-router-dom';

export default function ClassroomCard({ classroom, departmentName, instructorName }) {
  const students = classroom.stats?.activeStudents ?? 0;
  const lastSync = classroom.lastSyncedAt
    ? new Date(classroom.lastSyncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{classroom.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">/{classroom.slug}</p>
        </div>
        <span className="shrink-0 text-lg font-black text-brand-600 tabular-nums">{students}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        {departmentName && <span>{departmentName}</span>}
        {instructorName && <span>· {instructorName}</span>}
        {lastSync && <span className="text-slate-400">· Synced {lastSync}</span>}
      </div>

      <div className="flex gap-2 mt-4">
        <Link
          to={`/admin/classrooms/${classroom._id}`}
          className="btn-primary text-xs py-2 px-3 flex-1 text-center"
        >
          Manage
        </Link>
        <Link
          to={`/c/${classroom.slug}`}
          target="_blank"
          className="btn-secondary text-xs py-2 px-3"
        >
          Public ↗
        </Link>
      </div>
    </div>
  );
}
