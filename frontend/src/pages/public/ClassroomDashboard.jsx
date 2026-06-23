import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/client';
import Leaderboard from '../../components/Leaderboard';
import TopPerformersPodium from '../../components/TopPerformersPodium';
import DailyActivityChart from '../../components/DailyActivityChart';
import TopicChart from '../../components/TopicChart';
import DivisionComparison from '../../components/DivisionComparison';
import DashboardToolbar from '../../components/dashboard/DashboardToolbar';
import DashboardSection from '../../components/dashboard/DashboardSection';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';

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
  const [sortBy, setSortBy] = useState('todaySolved');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [metaRes, analyticsRes] = await Promise.all([
          publicApi.classroom(slug),
          publicApi.analytics(slug, divisionSlug || undefined),
        ]);
        setMeta(metaRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load classroom');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, divisionSlug]);

  const leaderboard = useMemo(() => {
    const source =
      sortBy === 'todaySolved'
        ? analytics?.todayTopPerformers || []
        : analytics?.leaderboard || [];
    return sortLeaderboard(source, sortBy);
  }, [analytics, sortBy]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardToolbar
        classroom={classroom}
        divisions={divisions}
        divisionSlug={divisionSlug}
        onDivisionChange={handleDivisionChange}
        lastSync={lastSync}
        joinSlug={slug}
        summary={analytics.summary}
      />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-5">
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

        {analytics.inactiveStudents?.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              Inactive 7+ days ({analytics.inactiveStudents.length})
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {analytics.inactiveStudents.map((s) => (
                <span
                  key={s.studentId}
                  className="text-xs bg-white border border-amber-200 px-2 py-1 rounded-lg text-slate-700"
                >
                  {s.displayName}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
