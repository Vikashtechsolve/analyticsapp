import TeacherInsights from '../TeacherInsights';
import AdminStatCard from './AdminStatCard';

export default function InsightsTab({
  classroomSlug,
  divisions,
  insights,
  loading,
  divisionId,
  onDivisionChange,
  onRefresh,
}) {
  const batch = insights?.batchProgress;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-brand-500 to-violet-500" />
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="admin-eyebrow">Insights scope</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Analytics for{' '}
                <span className="font-semibold text-slate-800">
                  {divisionId
                    ? divisions.find((d) => d._id === divisionId)?.name || 'selected division'
                    : 'all divisions'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                className="input text-sm w-full sm:w-auto sm:min-w-[11rem] py-2"
                value={divisionId}
                onChange={(e) => onDivisionChange(e.target.value)}
              >
                <option value="">All divisions</option>
                {divisions.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={onRefresh} className="btn-secondary text-sm" disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {batch && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
              <AdminStatCard label="In scope" value={batch.totalStudents} accent="slate" compact />
              <AdminStatCard label="Avg mastery" value={`${batch.avgMastery}%`} accent="brand" compact delay={0.03} />
              <AdminStatCard label="Avg solved" value={batch.avgSolved} accent="violet" compact delay={0.06} />
              <AdminStatCard label="Active today" value={batch.activeToday} accent="emerald" compact delay={0.09} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <div className="inline-block h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm mt-3">Loading classroom insights…</p>
        </div>
      ) : (
        <TeacherInsights insights={insights} classroomSlug={classroomSlug} />
      )}
    </div>
  );
}
