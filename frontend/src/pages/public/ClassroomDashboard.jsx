import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/client';
import Leaderboard from '../../components/Leaderboard';
import TopPerformersPodium from '../../components/TopPerformersPodium';
import DailyActivityChart from '../../components/DailyActivityChart';
import TopicChart from '../../components/TopicChart';
import DivisionComparison from '../../components/DivisionComparison';
import InactiveStudents from '../../components/InactiveStudents';
import DashboardToolbar from '../../components/dashboard/DashboardToolbar';
import DashboardSection from '../../components/dashboard/DashboardSection';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import DashboardContentSkeleton from '../../components/dashboard/DashboardContentSkeleton';

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

export default function ClassroomDashboard() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const divisionSlug = searchParams.get('division') || '';

  const [meta, setMeta] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('todaySolved');

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      setMetaLoading(true);
      setError('');
      try {
        const metaRes = await publicApi.classroom(slug);
        if (!cancelled) setMeta(metaRes.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load classroom');
          setMeta(null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const analyticsRes = await publicApi.analytics(slug, divisionSlug || undefined);
        if (!cancelled) setAnalytics(analyticsRes.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load analytics');
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };
    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [slug, divisionSlug]);

  const leaderboard = useMemo(() => {
    if (!analytics) return [];
    const source =
      sortBy === 'todaySolved'
        ? analytics.todayTopPerformers || []
        : analytics.leaderboard || [];
    return sortLeaderboard(source, sortBy);
  }, [analytics, sortBy]);

  if (metaLoading) return <DashboardSkeleton />;

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
        {analyticsLoading ? (
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
                  sortBy === 'todaySolved' ? 'No submissions yet today' : 'Hall of Fame is empty'
                }
                emptyMessage={
                  sortBy === 'todaySolved'
                    ? 'Students who solve problems today will appear here. Use All or a division filter above.'
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
          </>
        )}
      </main>
    </div>
  );
}
