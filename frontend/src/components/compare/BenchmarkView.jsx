import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import CompareMetricRow from './CompareMetricRow';

const Delta = ({ value, suffix = '' }) => {
  if (value == null) return <span className="text-slate-500">—</span>;
  const positive = value >= 0;
  return (
    <span className={`font-black tabular-nums ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positive ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
};

function BenchmarkCard({ title, subtitle, accent, children, delay = 0 }) {
  const borders = {
    brand: 'border-slate-200 from-white to-slate-50',
    amber: 'border-amber-200 from-amber-50/60 to-white',
    sky: 'border-sky-200 from-sky-50/60 to-white',
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b p-5 h-full ${borders[accent] || borders.brand} opacity-0 animate-scale-in hover:shadow-md transition-shadow`}
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      {subtitle && <p className="text-sm font-bold text-slate-900 mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RankStrip({ ranking }) {
  const overall = ranking?.primary?.overall;
  const division = ranking?.primary?.division;
  if (!overall?.rank && !division?.rank) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {overall?.rank && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Classroom</p>
            <p className="text-3xl font-black text-amber-700 tabular-nums mt-1">
              #{overall.rank}
              <span className="text-base text-slate-500 font-semibold"> / {overall.total}</span>
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Top <span className="text-amber-600 font-bold">{overall.percentile}%</span>
          </p>
        </div>
      )}
      {division?.rank && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
              {division.divisionName || 'Division'}
            </p>
            <p className="text-3xl font-black text-brand-600 tabular-nums mt-1">
              #{division.rank}
              <span className="text-base text-slate-500 font-semibold"> / {division.total}</span>
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Top <span className="text-brand-600 font-bold">{division.percentile}%</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function BenchmarkView({ comparison, ranking }) {
  if (!comparison) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center py-12 px-6">
        <p className="text-slate-800 font-semibold">Benchmarks not available yet</p>
        <p className="text-slate-500 text-sm mt-2">Run a classroom sync to enable comparisons.</p>
      </div>
    );
  }

  const { vsClassAvg, vsTopPerformer, vsPreviousMonth, topicBenchmarks } = comparison;
  const yourSolved = (vsClassAvg.classAvgSolved || 0) + (vsClassAvg.solved || 0);

  return (
    <div className="space-y-5">
      <RankStrip ranking={ranking} />

      <div className="grid md:grid-cols-3 gap-4">
        <BenchmarkCard title="Class average" subtitle="How you compare to peers" accent="brand" delay={0.05}>
          <CompareMetricRow
            label="Problems solved"
            you={yourSolved}
            them={vsClassAvg.classAvgSolved || 0}
            themLabel="Class avg"
          />
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Solved Δ</p>
              <p className="text-lg font-bold mt-1">
                <Delta value={vsClassAvg.solved} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Mastery Δ</p>
              <p className="text-lg font-bold mt-1">
                <Delta value={vsClassAvg.mastery} suffix="%" />
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Streak Δ</p>
              <p className="text-lg font-bold mt-1">
                <Delta value={vsClassAvg.streak} />
              </p>
            </div>
          </div>
        </BenchmarkCard>

        <BenchmarkCard
          title="Top performer"
          subtitle={vsTopPerformer?.name || 'No data yet'}
          accent="amber"
          delay={0.1}
        >
          {vsTopPerformer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border border-rose-100 p-3 text-center">
                  <p className="text-2xl font-black text-rose-600 tabular-nums">-{vsTopPerformer.solvedGap}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">problems behind</p>
                </div>
                <div className="rounded-xl bg-white border border-rose-100 p-3 text-center">
                  <p className="text-2xl font-black text-rose-600 tabular-nums">-{vsTopPerformer.masteryGap}%</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">mastery gap</p>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-sm space-y-1">
                <p className="text-slate-600">
                  Their solved: <strong className="text-slate-900">{vsTopPerformer.topSolved}</strong>
                </p>
                <p className="text-slate-600">
                  Their mastery: <strong className="text-amber-600">{vsTopPerformer.topMastery}%</strong>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Not enough classroom data.</p>
          )}
        </BenchmarkCard>

        <BenchmarkCard
          title="Month over month"
          subtitle={vsPreviousMonth ? 'Vs ~30 days ago' : 'Needs more history'}
          accent="sky"
          delay={0.15}
        >
          {vsPreviousMonth ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-white border border-slate-100 p-4 text-center">
                <p className="text-3xl font-black tabular-nums">
                  <Delta value={vsPreviousMonth.solvedDelta} />
                </p>
                <p className="text-xs text-slate-600 mt-1 font-medium">problems gained</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 font-bold text-xs">
                  E +{vsPreviousMonth.easyDelta}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                  M +{vsPreviousMonth.mediumDelta}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-xs">
                  H +{vsPreviousMonth.hardDelta}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Sync a few more times to unlock monthly trends.</p>
          )}
        </BenchmarkCard>
      </div>

      {topicBenchmarks?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm font-bold text-slate-900">Topic benchmarks</p>
          <p className="text-xs text-slate-500 mb-4">Your mastery vs class average and top student</p>
          <div className="h-72 sm:h-80 rounded-xl bg-white border border-slate-100 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicBenchmarks.slice(0, 8)} barGap={4} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="tag" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="student" fill="#ea580c" name="You" radius={[4, 4, 0, 0]} />
                <Bar dataKey="classAvg" fill="#38bdf8" name="Class avg" radius={[4, 4, 0, 0]} />
                <Bar dataKey="top" fill="#22c55e" name="Top" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
