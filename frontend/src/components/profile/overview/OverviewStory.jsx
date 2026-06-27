export default function OverviewStory({ story, ranking }) {
  const percentile = ranking?.primary?.overall?.percentile;
  const rank = ranking?.primary?.overall?.rank;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white shadow-lg opacity-0 animate-fade-in-up">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.35),_transparent_55%)] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-300 mb-3">
              Your progress story
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {story.headline}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              {story.subtext}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0 w-full lg:w-auto">
            {rank && (
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class rank</p>
                <p className="text-2xl sm:text-3xl font-black tabular-nums mt-1">
                  #{rank}
                  {percentile != null && (
                    <span className="text-sm font-semibold text-brand-300 ml-1.5">Top {percentile}%</span>
                  )}
                </p>
              </div>
            )}
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall score</p>
              <p className="text-2xl sm:text-3xl font-black tabular-nums text-brand-300 mt-1">{story.score}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This week</p>
              <p className="text-2xl sm:text-3xl font-black tabular-nums mt-1">{story.weekly}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">submissions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
