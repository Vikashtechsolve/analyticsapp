import LearningDepth from '../LearningDepth';
import TopicMastery from '../TopicMastery';
import RevisionTracker from '../RevisionTracker';
import ProfileSection from '../profile/ProfileSection';

export default function MasteryTab({ analytics }) {
  const avgMastery = analytics?.avgMastery ?? 0;
  const dueCount = analytics?.revision?.due?.length ?? 0;
  const topicCount = analytics?.topicMastery?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Tab intro */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 shadow-sm opacity-0 animate-fade-in-up">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl shadow-lg shadow-emerald-200/60">
              🎓
            </div>
            <div className="flex-1">
              <p className="section-eyebrow text-emerald-600">Mastery & Learning</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                How deep is your learning?
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                Go beyond problem counts — see topic strength, solving habits, and what to revise
                before you forget it.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="rounded-xl bg-white border border-emerald-100 px-4 py-2.5 text-center shadow-sm">
                <p className="text-2xl font-black text-emerald-600 tabular-nums">{avgMastery}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg mastery</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-center shadow-sm">
                <p className="text-2xl font-black text-slate-800 tabular-nums">{topicCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Topics</p>
              </div>
              {dueCount > 0 && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-center shadow-sm">
                  <p className="text-2xl font-black text-rose-600 tabular-nums">{dueCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Due</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProfileSection
        eyebrow="Skill map"
        title="Topic mastery"
        subtitle="Every DSA category scored — find your strengths and what to practice next."
        accent="amber"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          </svg>
        }
      >
        <TopicMastery topics={analytics?.topicMastery} avgMastery={analytics?.avgMastery} />
      </ProfileSection>

      <ProfileSection
        eyebrow="Solving style"
        title="Learning depth"
        subtitle="First-try success, retries, and how often you revisit problems."
        accent="emerald"
        delay={0.05}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        }
      >
        <LearningDepth depth={analytics?.learningDepth} variant="mastery" />
      </ProfileSection>

      <ProfileSection
        eyebrow="Memory"
        title="Revision tracker"
        subtitle="Spaced repetition — revisit problems before they fade from memory."
        accent="rose"
        delay={0.1}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <RevisionTracker revision={analytics?.revision} variant="mastery" />
      </ProfileSection>
    </div>
  );
}
