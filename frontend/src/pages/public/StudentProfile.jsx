import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../../api/client';
import ActivityTab from '../../components/activity/ActivityTab';
import MasteryTab from '../../components/mastery/MasteryTab';
import CompareTab from '../../components/compare/CompareTab';
import ProfileHero from '../../components/profile/ProfileHero';
import ProfileTabs from '../../components/profile/ProfileTabs';
import ProfileSkeleton from '../../components/profile/ProfileSkeleton';
import TabPanel from '../../components/profile/TabPanel';
import StudentRankCard from '../../components/profile/StudentRankCard';
import OverviewTab from '../../components/profile/overview/OverviewTab';

export default function StudentProfile() {
  const { slug, studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    publicApi
      .student(slug, studentId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [slug, studentId]);

  if (loading) return <ProfileSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600 text-lg font-semibold">{error || 'Student not found'}</p>
        <a href={`/c/${slug}`} className="text-brand-600 text-sm font-medium hover:underline">
          ← Back to classroom
        </a>
      </div>
    );
  }

  const { student, snapshot, history, analytics, ranking } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-12">
        <ProfileHero
          student={student}
          snapshot={snapshot}
          analytics={analytics}
          ranking={ranking}
          classroomSlug={slug}
        />

        {ranking && (
          <div className="mt-4">
            <StudentRankCard ranking={ranking} />
          </div>
        )}

        {snapshot?.syncError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">
            <p className="font-semibold">Sync error</p>
            <p className="text-sm mt-1">{snapshot.syncError}</p>
          </div>
        ) : snapshot ? (
          <>
            <div className="mt-5">
              <ProfileTabs active={tab} onChange={setTab} />
            </div>

            <div className="mt-5">
              <TabPanel active={tab} id="overview">
                <OverviewTab
                  snapshot={snapshot}
                  analytics={analytics}
                  ranking={ranking}
                  onNavigateTab={setTab}
                />
              </TabPanel>

              <TabPanel active={tab} id="mastery">
                <MasteryTab analytics={analytics} />
              </TabPanel>

              <TabPanel active={tab} id="activity">
                <ActivityTab snapshot={snapshot} history={history} />
              </TabPanel>

              <TabPanel active={tab} id="compare">
                <CompareTab
                  slug={slug}
                  studentId={studentId}
                  studentName={student.displayName}
                  ranking={ranking}
                />
              </TabPanel>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white text-center py-12">
            <p className="text-slate-800 font-medium">No snapshot data yet</p>
            <p className="text-slate-500 text-sm mt-2">Ask your instructor to run a classroom sync.</p>
          </div>
        )}
      </div>
    </div>
  );
}
