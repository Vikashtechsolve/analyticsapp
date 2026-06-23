import NextSteps from '../../NextSteps';
import DailySolvesPanel from '../../DailySolvesPanel';
import DifficultyBreakdown from '../DifficultyBreakdown';
import RecentSolvesList from '../RecentSolvesList';
import ProfileSection from '../ProfileSection';
import OverviewStory from './OverviewStory';
import OverviewMetrics from './OverviewMetrics';
import ExploreMore from './ExploreMore';
import { buildOverviewStory } from './overviewUtils';

export default function OverviewTab({ snapshot, analytics, ranking, onNavigateTab }) {
  const story = buildOverviewStory({ snapshot, analytics, ranking });

  return (
    <div className="space-y-6">
      <OverviewStory story={story} ranking={ranking} />

      <OverviewMetrics snapshot={snapshot} analytics={analytics} />

      <NextSteps steps={analytics?.nextSteps} />

      <div className="grid xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <ProfileSection
            eyebrow="Your journal"
            title="Daily wins"
            subtitle="Every date you coded — tap a day to relive the problems you cracked."
            accent="brand"
            delay={0.08}
            className="h-full"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
          >
            <DailySolvesPanel dailySolves={analytics?.dailySolves} variant="overview" />
          </ProfileSection>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <ProfileSection
            eyebrow="Balance"
            title="Difficulty profile"
            subtitle="How your solved problems spread across Easy, Medium, and Hard."
            accent="emerald"
            delay={0.1}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          >
            <DifficultyBreakdown snapshot={snapshot} variant="overview" />
          </ProfileSection>

          <ProfileSection
            eyebrow="Latest"
            title="Recent victories"
            subtitle="Your freshest accepted submissions — proof of progress."
            accent="amber"
            delay={0.12}
            noPadding={!snapshot.recentSolves?.length}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            }
          >
            {snapshot.recentSolves?.length ? (
              <RecentSolvesList solves={snapshot.recentSolves} variant="overview" />
            ) : (
              <div className="p-5 sm:p-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center py-10 px-4">
                  <span className="text-3xl mb-2" aria-hidden>
                    🎯
                  </span>
                  <p className="text-slate-800 font-semibold">No recent solves yet</p>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs">
                    Solve a problem on LeetCode — it will show up here after the next classroom sync.
                  </p>
                </div>
              </div>
            )}
          </ProfileSection>
        </div>
      </div>

      <ExploreMore onNavigate={onNavigateTab} />
    </div>
  );
}
