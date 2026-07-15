import ActivityHeatmap from '../ActivityHeatmap';
import ProgressChart from '../profile/ProgressChart';
import ProfileSection from '../profile/ProfileSection';
import { weeklyActivityOf } from '../profile/overview/overviewUtils';

export default function ActivityTab({ snapshot, history }) {
  const weekly = weeklyActivityOf(snapshot);
  const streak = snapshot?.streak ?? 0;
  const hasHistory = history?.length > 1;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-brand-50/40 shadow-sm opacity-0 animate-fade-in-up">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-brand-500 to-amber-400" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-brand-600 text-white text-2xl shadow-lg shadow-sky-200/60">
              📈
            </div>
            <div className="flex-1">
              <p className="section-eyebrow text-sky-600">Activity</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Your coding consistency
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                {streak >= 3
                  ? `${streak}-day streak and ${weekly} submissions this week — keep the rhythm going.`
                  : weekly > 0
                    ? `${weekly} submissions this week. Build a streak by coding a little every day.`
                    : 'Track daily submissions and growth across classroom syncs.'}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="rounded-xl bg-white border border-amber-100 px-4 py-2.5 text-center shadow-sm">
                <p className="text-2xl font-black text-amber-600 tabular-nums">{streak}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Streak</p>
              </div>
              <div className="rounded-xl bg-white border border-brand-100 px-4 py-2.5 text-center shadow-sm">
                <p className="text-2xl font-black text-brand-600 tabular-nums">{weekly}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">This week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProfileSection
        eyebrow="Heatmap"
        title="Submission calendar"
        subtitle="GitHub-style view of every day you submitted — darker orange means more activity."
        accent="brand"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        }
      >
        <ActivityHeatmap
          calendar={snapshot.calendar}
          streak={snapshot.streak}
          variant="activity"
        />
      </ProfileSection>

      <ProfileSection
        eyebrow="Trajectory"
        title="Progress over time"
        subtitle="How your total solved count grew with each classroom sync."
        accent="sky"
        delay={0.05}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        }
      >
        {hasHistory ? (
          <ProgressChart history={history} variant="activity" />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center py-14 px-6">
            <span className="text-3xl mb-2 block" aria-hidden>
              📉
            </span>
            <p className="text-slate-800 font-semibold">Growth chart coming soon</p>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              After a few classroom syncs, you will see your solved count trend line here.
            </p>
          </div>
        )}
      </ProfileSection>
    </div>
  );
}
