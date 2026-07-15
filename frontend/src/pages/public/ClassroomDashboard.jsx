import { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/client';
import Leaderboard from '../../components/Leaderboard';
import TopPerformersPodium from '../../components/TopPerformersPodium';
import DashboardToolbar from '../../components/dashboard/DashboardToolbar';
import DashboardSection from '../../components/dashboard/DashboardSection';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import DashboardContentSkeleton from '../../components/dashboard/DashboardContentSkeleton';
import { Skeleton } from '../../components/ui/Skeleton';
import { DEFAULT_LEADERBOARD_SORT } from '../../utils/leaderboardSort';

const DailyActivityChart = lazy(() => import('../../components/DailyActivityChart'));
const TopicChart = lazy(() => import('../../components/TopicChart'));
const DivisionComparison = lazy(() => import('../../components/DivisionComparison'));
const InactiveStudents = lazy(() => import('../../components/InactiveStudents'));

const ChartFallback = () => <Skeleton className="h-64 w-full rounded-2xl" />;

const sortLeaderboard = (items, sortBy) => {
  const sorters = {
    score: (a, b) => b.score - a.score,
    todaySolved: (a, b) => (b.todaySolved || 0) - (a.todaySolved || 0),
    totalSolved: (a, b) => b.totalSolved - a.totalSolved,
    streak: (a, b) => b.streak - a.streak,
    weeklyActivity: (a, b) => b.weeklyActivity - a.weeklyActivity,
    contestRating: (a, b) => (b.contestRating || 0) - (a.contestRating || 0),
  };
  const sorted = [...items].sort(sorters[sortBy] || sorters.score);
  return sorted.map((r, i) => {
    const mr = r.byMetric?.[sortBy];
    return {
      ...r,
      rank: i + 1,
      viewRank: i + 1,
      overallRank: mr?.overall?.rank ?? r.overallRank,
      overallTotal: mr?.overall?.total ?? r.overallTotal,
      overallPercentile: mr?.overall?.percentile ?? r.overallPercentile,
      divisionRank: mr?.division?.rank ?? r.divisionRank,
      divisionTotal: mr?.division?.total ?? r.divisionTotal,
      divisionPercentile: mr?.division?.percentile ?? r.divisionPercentile,
      divisionName: mr?.division?.divisionName ?? r.divisionName,
    };
  });
};

/** Today list — prefer todayTopPerformers, else filter full leaderboard. */
const todaySourceList = (analytics) => {
  const tops = analytics.todayTopPerformers || [];
  if (tops.length) return tops;
  return (analytics.leaderboard || []).filter((r) => (r.todaySolved || 0) > 0);
};

export default function ClassroomDashboard() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const divisionSlug = searchParams.get('division') || '';
  const prevSlugRef = useRef(slug);

  const [meta, setMeta] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState(DEFAULT_LEADERBOARD_SORT);

  useEffect(() => {
    let cancelled = false;
    const slugChanged = prevSlugRef.current !== slug;
    prevSlugRef.current = slug;

    const load = async () => {
      setLoading(true);
      setError('');
      setAnalytics(null);
      if (slugChanged) setMeta(null);

      try {
        const [metaRes, analyticsRes] = await Promise.all([
          publicApi.classroom(slug),
          publicApi.analytics(slug, divisionSlug || undefined),
        ]);
        if (cancelled) return;
        setMeta(metaRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load classroom');
        if (slugChanged) setMeta(null);
        setAnalytics(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, divisionSlug]);

  const leaderboard = useMemo(() => {
    if (!analytics) return [];
    if (sortBy === 'todaySolved') {
      return sortLeaderboard(todaySourceList(analytics), 'todaySolved');
    }
    return sortLeaderboard(analytics.leaderboard || [], sortBy);
  }, [analytics, sortBy]);

  if (loading && !meta) return <DashboardSkeleton />;

  if (error && !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold text-lg">Could not load dashboard</p>
          <p className="text-slate-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const { classroom, divisions } = meta;
  const lastSync = classroom.lastSyncedAt
    ? new Date(classroom.lastSyncedAt).toLocaleString()
    : 'Never';

  const handleDivisionChange = (dSlug) => {
    if (dSlug) setSearchParams({ division: dSlug });
    else setSearchParams({});
  };

  const summary = analytics?.summary || {
    totalStudents: 0,
    totalStudentsOverall: 0,
    avgSolved: 0,
    activeToday: 0,
    avgStreak: 0,
    rankingScope: 'classroom',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardToolbar
        classroom={classroom}
        divisions={divisions}
        divisionSlug={divisionSlug}
        onDivisionChange={handleDivisionChange}
        lastSync={lastSync}
        joinSlug={slug}
        summary={summary}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-5">
        {!analytics ? (
          <DashboardContentSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
            <p className="text-red-700 font-semibold">Could not load analytics</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        ) : (
          <>
            <div id="hall-of-fame" className="scroll-mt-16">
              <TopPerformersPodium
                items={leaderboard}
                classroomSlug={slug}
                sortBy={sortBy}
                onSortChange={setSortBy}
                maxItems={5}
                titlePrefix={sortBy === 'todaySolved' ? "Today's" : 'Hall of'}
                titleAccent={sortBy === 'todaySolved' ? 'Champions' : 'Fame'}
                rankingScope={analytics.summary.rankingScope}
                activeDivisionName={analytics.summary.activeDivision?.name}
                accent={sortBy === 'todaySolved' ? 'emerald' : 'amber'}
                emptyTitle={
                  sortBy === 'todaySolved' ? 'No problems solved yet today' : 'Hall of Fame is empty'
                }
                emptyMessage={
                  sortBy === 'todaySolved'
                    ? 'Students who solve problems today will appear here. Switch to Overall to see full rankings.'
                    : 'Sync the classroom to reveal top performers.'
                }
              />
            </div>

            <Leaderboard
              items={leaderboard}
              classroomSlug={slug}
              sortBy={sortBy}
              onSortChange={setSortBy}
              rankingScope={analytics.summary.rankingScope}
              limit={sortBy === 'todaySolved' ? 10 : undefined}
            />

            <Suspense fallback={<ChartFallback />}>
              <DashboardSection
                eyebrow="Momentum"
                title="Activity & progress"
                description="Daily submissions and topic coverage across the classroom."
                delay={0.15}
                id="activity"
              >
                <DailyActivityChart data={analytics.dailyActivity} />

                <div
                  className={`grid gap-5 items-stretch ${
                    analytics.divisionComparison?.length ? 'lg:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  <TopicChart topics={analytics.topics} />
                  {analytics.divisionComparison?.length > 0 && (
                    <DivisionComparison
                      data={analytics.divisionComparison}
                      classroomSlug={slug}
                    />
                  )}
                </div>
              </DashboardSection>

              <InactiveStudents students={analytics.inactiveStudents} />
            </Suspense>
          </>
        )}
      </main>
    </div>
  );
}
