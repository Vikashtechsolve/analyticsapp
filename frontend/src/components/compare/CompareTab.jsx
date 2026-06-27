import { useEffect, useState } from 'react';
import { publicApi } from '../../api/client';
import PeerPicker from './PeerPicker';
import PeerCompareView from './PeerCompareView';
import BenchmarkView from './BenchmarkView';
import ProfileSection from '../profile/ProfileSection';
import { Skeleton } from '../ui/Skeleton';

function BenchmarkSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="grid sm:grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export default function CompareTab({ slug, studentId, studentName, ranking }) {
  const [peers, setPeers] = useState([]);
  const [peersLoading, setPeersLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [selectedPeerId, setSelectedPeerId] = useState(null);
  const [peerData, setPeerData] = useState(null);
  const [peerLoading, setPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState('');

  useEffect(() => {
    if (!slug || !studentId) return;
    let cancelled = false;

    setPeersLoading(true);
    setComparisonLoading(true);

    Promise.all([
      publicApi.studentPeers(slug, studentId),
      publicApi.studentComparison(slug, studentId),
    ])
      .then(([peersRes, comparisonRes]) => {
        if (cancelled) return;
        setPeers(peersRes.data.peers || []);
        setComparison(comparisonRes.data);
      })
      .catch(() => {
        if (!cancelled) {
          setPeers([]);
          setComparison(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPeersLoading(false);
          setComparisonLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, studentId]);

  useEffect(() => {
    if (!selectedPeerId) {
      setPeerData(null);
      setPeerError('');
      return;
    }

    setPeerLoading(true);
    setPeerError('');
    publicApi
      .compareStudents(slug, studentId, selectedPeerId)
      .then((res) => setPeerData(res.data))
      .catch((err) => {
        setPeerData(null);
        setPeerError(err.response?.data?.message || 'Failed to load comparison');
      })
      .finally(() => setPeerLoading(false));
  }, [slug, studentId, selectedPeerId]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-brand-50/30 shadow-sm opacity-0 animate-fade-in-up">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-brand-500 to-amber-400" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl shadow-lg shadow-violet-200/60">
              ⚔️
            </div>
            <div className="flex-1">
              <p className="section-eyebrow text-violet-600">Compare</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                How do you stack up?
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                Benchmark against the class, the top performer, your past self — or pick any classmate
                for a head-to-head breakdown.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PeerPicker
        peers={peers}
        selectedId={selectedPeerId}
        onSelect={setSelectedPeerId}
        loading={peersLoading}
        youName={studentName}
      />

      {peerError && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {peerError}
        </div>
      )}

      {selectedPeerId && (
        <PeerCompareView data={peerData} loading={peerLoading} />
      )}

      <ProfileSection
        eyebrow="Benchmarks"
        title={selectedPeerId ? 'Class benchmarks' : 'Classroom benchmarks'}
        subtitle={
          selectedPeerId
            ? 'Your standing vs class averages while you compare with a peer above.'
            : 'See how you compare to the class average, top performer, and your past self.'
        }
        accent="violet"
        delay={selectedPeerId ? 0.05 : 0}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        }
      >
        {comparisonLoading ? (
          <BenchmarkSkeleton />
        ) : (
          <BenchmarkView comparison={comparison} ranking={selectedPeerId ? null : ranking} />
        )}
      </ProfileSection>
    </div>
  );
}
