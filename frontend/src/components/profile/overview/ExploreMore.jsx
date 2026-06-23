const LINKS = [
  {
    tab: 'mastery',
    label: 'Mastery & Learning',
    desc: 'Topic strength, learning depth, and revision queue',
    accent: 'from-emerald-500 to-teal-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    tab: 'activity',
    label: 'Activity',
    desc: 'Heatmap, streaks, and growth over time',
    accent: 'from-sky-500 to-blue-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  },
  {
    tab: 'compare',
    label: 'Compare',
    desc: 'See how you stack up against classmates',
    accent: 'from-violet-500 to-purple-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
];

export default function ExploreMore({ onNavigate }) {
  return (
    <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="mb-4 px-0.5">
        <p className="section-eyebrow">Keep exploring</p>
        <h3 className="text-lg font-bold text-slate-900">Dive deeper into your profile</h3>
        <p className="text-sm text-slate-600 mt-1">
          There is more to discover — mastery maps, activity trends, and class benchmarks.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {LINKS.map((link) => (
          <button
            key={link.tab}
            type="button"
            onClick={() => onNavigate(link.tab)}
            className="group text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${link.accent} mb-4 group-hover:w-full transition-all duration-500`} />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-100 transition-colors">
                {link.icon}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {link.label}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{link.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tab →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
