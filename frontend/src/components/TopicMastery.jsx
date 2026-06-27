import { useMemo, useState } from 'react';
import MasteryRing from './mastery/MasteryRing';
import { getTopicMeta, STRENGTH_CONFIG, LEVEL_LABELS } from './mastery/topicConfig';

const FILTERS = [
  { id: 'all', label: 'All topics' },
  { id: 'strong', label: 'Strong' },
  { id: 'moderate', label: 'Growing' },
  { id: 'weak', label: 'Needs focus' },
];

function TopicCard({ topic, index, featured }) {
  const meta = getTopicMeta(topic.tag);
  const strength = STRENGTH_CONFIG[topic.strength] || STRENGTH_CONFIG.weak;
  const tierLabel = LEVEL_LABELS[topic.level] || topic.level;

  if (featured) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border ${meta.border} ${meta.bg} p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 opacity-0 animate-scale-in`}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${strength.gradient}`} />
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <MasteryRing value={topic.mastery} size={72} stroke={6} color={strength.ring} className="sm:hidden shrink-0">
            <span className="text-lg font-black text-slate-900 tabular-nums">{topic.mastery}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">%</span>
          </MasteryRing>
          <MasteryRing value={topic.mastery} size={88} stroke={7} color={strength.ring} className="hidden sm:block shrink-0">
            <span className="text-xl font-black text-slate-900 tabular-nums">{topic.mastery}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">%</span>
          </MasteryRing>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white border ${meta.border} text-sm font-bold ${meta.text} shadow-sm`}
                aria-hidden
              >
                {meta.icon}
              </span>
              <h4 className="font-bold text-slate-900 truncate">{topic.tag}</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${strength.badge}`}>
                {strength.label}
              </span>
              {tierLabel && tierLabel !== 'Tracked' && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 bg-white/80 text-slate-600">
                  {tierLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{strength.desc}</p>
            <p className="text-sm font-bold text-slate-800 mt-2 tabular-nums">
              {topic.solved} <span className="font-medium text-slate-500">problems solved</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 hover:border-slate-300 hover:shadow-sm transition-all opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.025}s` }}
    >
      <MasteryRing value={topic.mastery} size={52} stroke={5} color={strength.ring}>
        <span className="text-xs font-black text-slate-800 tabular-nums">{topic.mastery}</span>
      </MasteryRing>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.bg} border ${meta.border} text-[10px] font-bold ${meta.text}`}
            aria-hidden
          >
            {meta.icon}
          </span>
          <p className="text-sm font-bold text-slate-900 truncate">{topic.tag}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${strength.badge}`}>
            {strength.label}
          </span>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums">{topic.solved} solved</span>
        </div>
      </div>

      <div className="hidden sm:block w-24 shrink-0">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${strength.gradient} transition-all duration-700`}
            style={{ width: `${topic.mastery}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TopicMastery({ topics, avgMastery }) {
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => {
    if (!topics?.length) return null;
    return {
      strong: topics.filter((t) => t.strength === 'strong').length,
      moderate: topics.filter((t) => t.strength === 'moderate').length,
      weak: topics.filter((t) => t.strength === 'weak').length,
      total: topics.length,
      top3: topics.slice(0, 3),
      focus: [...topics].filter((t) => t.strength === 'weak').slice(0, 3),
    };
  }, [topics]);

  const filtered = useMemo(() => {
    if (!topics?.length) return [];
    if (filter === 'all') return topics;
    return topics.filter((t) => t.strength === filter);
  }, [topics, filter]);

  if (!topics?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center py-14 px-6">
        <span className="text-4xl mb-3 block" aria-hidden>
          🧩
        </span>
        <p className="text-slate-800 font-semibold text-lg">Topic map loading…</p>
        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          Mastery scores appear after your instructor syncs the classroom. Each DSA topic gets a
          strength score based on problems solved and recent practice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.3),_transparent_60%)] pointer-events-none" />
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-5">
              <MasteryRing value={avgMastery} size={100} stroke={8} color="#fb923c" trackColor="rgba(255,255,255,0.15)">
                <span className="text-2xl font-black tabular-nums">{avgMastery}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">avg %</span>
              </MasteryRing>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">Skill map</p>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-1">Your DSA topic mastery</h3>
                <p className="text-sm text-slate-300 mt-1.5 max-w-md leading-relaxed">
                  {stats.strong > 0
                    ? `${stats.strong} strong topic${stats.strong > 1 ? 's' : ''} — keep them sharp with review.`
                    : 'Solve more tagged problems to build your skill map.'}
                  {stats.weak > 0 && ` ${stats.weak} area${stats.weak > 1 ? 's' : ''} need focus.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:ml-auto">
              {[
                { key: 'strong', count: stats.strong, label: 'Strong', color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' },
                { key: 'moderate', count: stats.moderate, label: 'Growing', color: 'bg-amber-500/20 border-amber-400/30 text-amber-200' },
                { key: 'weak', count: stats.weak, label: 'Focus', color: 'bg-rose-500/20 border-rose-400/30 text-rose-200' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setFilter(s.key)}
                  className={`rounded-xl border px-4 py-2.5 text-left transition-all hover:scale-105 ${s.color} ${filter === s.key ? 'ring-2 ring-white/40' : ''}`}
                >
                  <p className="text-2xl font-black tabular-nums">{s.count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top strengths */}
      {stats.top3.length > 0 && filter === 'all' && (
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Your superpowers</p>
              <h4 className="text-base font-bold text-slate-900">Best performing topics</h4>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stats.top3.map((t, i) => (
              <TopicCard key={t.tag} topic={t} index={i} featured />
            ))}
          </div>
        </div>
      )}

      {/* Focus areas callout */}
      {stats.focus.length > 0 && filter === 'all' && (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 text-lg font-bold">
              ↑
            </span>
            <div>
              <p className="font-bold text-rose-800">Level up next</p>
              <p className="text-sm text-slate-600 mt-0.5">
                Prioritize:{' '}
                <span className="font-semibold text-slate-800">
                  {stats.focus.map((t) => t.tag).join(' · ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter + full list */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Full breakdown</p>
            <h4 className="text-base font-bold text-slate-900">
              {filtered.length} topic{filtered.length !== 1 ? 's' : ''}
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 rounded-2xl border border-slate-200 bg-slate-50/50 p-2">
          {filtered.map((t, i) => (
            <TopicCard key={t.tag} topic={t} index={i} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-10">No topics in this category.</p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed px-1">
        Mastery is estimated from problems solved per topic, difficulty tier, recent practice, and
        acceptance rate. Scores update after each classroom sync.
      </p>
    </div>
  );
}
