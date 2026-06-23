const STATS = [
  {
    key: 'totalStudents',
    label: 'Students',
    desc: 'Active in classroom',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    accent: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 border-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    key: 'avgSolved',
    label: 'Avg Solved',
    desc: 'Problems per student',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: 'from-brand-500 to-orange-600',
    bg: 'bg-brand-50 border-brand-100',
    iconColor: 'text-brand-600',
  },
  {
    key: 'activeToday',
    label: 'Active Today',
    desc: 'Submitted today',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    accent: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
    pulse: true,
  },
  {
    key: 'avgStreak',
    label: 'Avg Streak',
    desc: 'Day consistency',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    ),
    accent: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600',
  },
];

export default function DashboardStatGrid({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat, i) => (
        <div
          key={stat.key}
          className={`relative overflow-hidden rounded-2xl border p-5 ${stat.bg} hover:shadow-md transition-all duration-300 hover:-translate-y-1 opacity-0 animate-scale-in`}
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accent}`} />
          <div className="flex items-start justify-between gap-3">
            <div className={`p-2.5 rounded-xl bg-white shadow-sm ${stat.iconColor}`}>
              {stat.icon}
            </div>
            {stat.pulse && summary[stat.key] > 0 && (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            )}
          </div>
          <p className="stat-value mt-4">{summary[stat.key] ?? '—'}</p>
          <p className="stat-label mt-1">{stat.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stat.desc}</p>
        </div>
      ))}
    </div>
  );
}
