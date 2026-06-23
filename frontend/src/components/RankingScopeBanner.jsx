export default function RankingScopeBanner({ summary }) {
  const isDivision = summary?.rankingScope === 'division' && summary?.activeDivision;

  if (!isDivision) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orange-600 text-white text-lg font-bold shadow-md">
          #
        </span>
        <div>
          <p className="text-base font-semibold text-slate-900">Classroom-wide rankings</p>
          <p className="text-sm text-slate-600 mt-0.5">
            {summary.totalStudentsOverall ?? summary.totalStudents} students ranked · overall
            and division ranks shown side by side
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50 px-5 py-4 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white text-lg font-bold shadow-md">
        {summary.activeDivision.name?.[0]}
      </span>
      <div>
        <p className="text-base font-semibold text-slate-900">
          {summary.activeDivision.name} division
        </p>
        <p className="text-sm text-slate-600 mt-0.5">
          Leaderboard sorted within division ({summary.totalStudents} students) · overall rank
          still visible in each row
        </p>
      </div>
    </div>
  );
}
