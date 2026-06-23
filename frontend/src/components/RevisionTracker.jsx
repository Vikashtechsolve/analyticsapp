const priorityStyle = {
  high: {
    card: 'border-red-200 bg-gradient-to-r from-red-50/90 to-white',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    ring: 'ring-red-100',
  },
  medium: {
    card: 'border-amber-200 bg-gradient-to-r from-amber-50/90 to-white',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'ring-amber-100',
  },
  low: {
    card: 'border-slate-200 bg-gradient-to-r from-slate-50 to-white',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    ring: 'ring-slate-100',
  },
};

export default function RevisionTracker({ revision, variant }) {
  if (!revision) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center py-12 px-6">
        <span className="text-3xl mb-2 block" aria-hidden>
          🕐
        </span>
        <p className="text-slate-800 font-semibold">Revision tracking activates soon</p>
        <p className="text-slate-500 text-sm mt-1">Problem-level data is needed to schedule reviews.</p>
      </div>
    );
  }

  const isMastery = variant === 'mastery';
  const dueCount = revision.due?.length || 0;
  const upcomingCount = revision.upcoming?.length || 0;

  return (
    <div className="space-y-6">
      {revision.dataNote && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 leading-relaxed">
          <span className="font-semibold text-slate-700">Note: </span>
          {revision.dataNote}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 ${
            dueCount > 0
              ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white shadow-sm'
              : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm'
          }`}
        >
          {dueCount > 0 && (
            <div className="absolute top-3 right-3 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </div>
          )}
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Due now</p>
          <p className={`text-4xl font-black tabular-nums mt-1 ${dueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {dueCount}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            {dueCount > 0 ? 'Problems waiting for review' : 'All caught up — great memory!'}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Coming up</p>
          <p className="text-4xl font-black text-sky-600 tabular-nums mt-1">{upcomingCount}</p>
          <p className="text-sm text-slate-600 mt-2">Scheduled in the next revision windows</p>
        </div>
      </div>

      {revision.forgottenTopics?.length > 0 && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-black text-lg">
            !
          </span>
          <div>
            <p className="font-bold text-amber-900">Topics fading from memory</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Revisit problems tagged:{' '}
              <span className="font-semibold text-slate-800">{revision.forgottenTopics.join(' · ')}</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm font-bold text-slate-900">Due for revision</p>
          </div>
          {revision.due?.length ? (
            <ul className={`space-y-2 ${isMastery ? 'max-h-80' : 'max-h-72'} overflow-y-auto pr-1`}>
              {revision.due.map((r, i) => {
                const style = priorityStyle[r.priority] || priorityStyle.low;
                return (
                  <li
                    key={r.slug}
                    className={`rounded-xl border p-4 ring-1 ${style.ring} ${style.card} opacity-0 animate-fade-in-up hover:shadow-sm transition-shadow`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 items-start">
                          <span className="font-bold text-slate-900 text-sm leading-snug">{r.title}</span>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}>
                            {r.daysSince}d ago
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">{r.revisionDue}</p>
                        {r.revisited && (
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">Previously re-solved</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 py-12 text-center">
              <span className="text-2xl mb-2 block" aria-hidden>
                ✓
              </span>
              <p className="text-emerald-700 font-semibold">Nothing due right now</p>
              <p className="text-slate-500 text-xs mt-1">Keep solving — reviews will appear here</p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-sky-500" />
            <p className="text-sm font-bold text-slate-900">On the horizon</p>
          </div>
          {revision.upcoming?.length > 0 ? (
            <ul className="space-y-2">
              {revision.upcoming.slice(0, isMastery ? 10 : 8).map((r, i) => (
                <li
                  key={r.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-sky-200 hover:shadow-sm transition-all opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className="text-sm text-slate-800 font-semibold truncate">{r.title}</span>
                  <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 tabular-nums">
                    in {r.daysUntilDue}d
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center bg-slate-50/50">
              <p className="text-slate-500 text-sm font-medium">Nothing scheduled yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
