import { Link } from 'react-router-dom';

export default function DashboardHero({
  classroom,
  divisions,
  divisionSlug,
  onDivisionChange,
  lastSync,
  joinSlug,
  studentCount,
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
      {/* Decorative graphics */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-brand-100/80 via-amber-50/50 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-sky-50 to-transparent rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      <svg
        className="absolute right-8 top-8 w-32 h-32 text-brand-100/60 pointer-events-none hidden md:block"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden
      >
        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" />
        <path d="M35 75 L55 45 L75 60 L95 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="max-w-2xl animate-fade-in-up">
            <p className="section-eyebrow mb-2">Live Classroom Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {classroom.name}
            </h1>
            {classroom.description && (
              <p className="section-desc mt-3 text-slate-700">
                {classroom.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse-soft" />
                {studentCount} students tracked
              </span>
              <span className="text-slate-500">
                Updated {lastSync}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Link
              to={`/c/${joinSlug}/join`}
              className="btn-primary text-center px-6 py-3 text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Join This Classroom →
            </Link>
            <p className="text-xs text-slate-500 text-center lg:text-left max-w-[200px]">
              New here? Request access and start climbing the leaderboard.
            </p>
          </div>
        </div>

        {/* Division pills */}
        <div className="mt-8 pt-6 border-t border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <p className="text-sm font-semibold text-slate-700 mb-3">Filter by division</p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onDivisionChange('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !divisionSlug
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All students
            </button>
            {divisions.map((d) => (
              <button
                key={d._id}
                type="button"
                onClick={() => onDivisionChange(d.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  divisionSlug === d.slug
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
