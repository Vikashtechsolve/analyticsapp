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

function ScoreboardCard({ label, you, peer, unit = '', invert = false }) {
  const delta = you - peer;
  const youAhead = invert ? delta < 0 : delta > 0;
  const tie = delta === 0;

  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        tie
          ? 'border-slate-200 bg-slate-50'
          : youAhead
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-rose-200 bg-rose-50/50'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex items-center justify-center gap-3 mt-2">
        <div>
          <p className="text-2xl font-black text-brand-600 tabular-nums">
            {you}
            {unit}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">You</p>
        </div>
        <span className="text-slate-300 font-bold">vs</span>
        <div>
          <p className="text-2xl font-black text-violet-600 tabular-nums">
            {peer}
            {unit}
          </p>
          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">Them</p>
        </div>
      </div>
      {!tie && (
        <p className={`text-xs font-bold mt-2 ${youAhead ? 'text-emerald-600' : 'text-rose-600'}`}>
          {youAhead ? '+' : ''}
          {delta}
          {unit} {youAhead ? 'ahead' : 'behind'}
        </p>
      )}
    </div>
  );
}

export default function PeerCompareView({ data, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <div className="inline-block h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-3">Loading comparison…</p>
      </div>
    );
  }

  if (!data) return null;

  const { you, peer, deltas, topicComparison, ahead } = data;
  const winsYou = Object.values(ahead).filter(Boolean).length;
  const winsThem = Object.keys(ahead).length - winsYou;

  const chartData = topicComparison.slice(0, 8).map((t) => ({
    tag: t.tag.length > 12 ? `${t.tag.slice(0, 11)}…` : t.tag,
    fullTag: t.tag,
    you: t.you,
    peer: t.peer,
  }));

  return (
    <div className="space-y-5 opacity-0 animate-fade-in-up">
      {/* Versus header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.35),_transparent_60%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Versus</p>
            <h3 className="text-xl sm:text-2xl font-extrabold mt-1">
              You vs {peer.displayName}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              @{peer.leetcodeUsername}
              {peer.divisionName && ` · ${peer.divisionName}`}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-brand-400 tabular-nums">#{you.rank}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Your rank</p>
            </div>
            <div className="text-2xl text-slate-600 self-center">·</div>
            <div className="text-center">
              <p className="text-3xl font-black text-violet-300 tabular-nums">#{peer.rank}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Their rank</p>
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-200">
            You lead {winsYou} metric{winsYou !== 1 ? 's' : ''}
          </span>
          <span className="rounded-lg bg-violet-500/20 border border-violet-400/30 px-3 py-1 text-xs font-bold text-violet-200">
            They lead {winsThem} metric{winsThem !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Quick scoreboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ScoreboardCard label="Score" you={you.score} peer={peer.score} />
        <ScoreboardCard label="Solved" you={you.totalSolved} peer={peer.totalSolved} />
        <ScoreboardCard label="Mastery" you={you.avgMastery} peer={peer.avgMastery} unit="%" />
        <ScoreboardCard label="Streak" you={you.streak} peer={peer.streak} unit="d" />
      </div>

      {/* Detailed metrics */}
      <div className="grid sm:grid-cols-2 gap-3">
        <CompareMetricRow label="Overall score" you={you.score} them={peer.score} themLabel={peer.displayName} />
        <CompareMetricRow label="Problems solved" you={you.totalSolved} them={peer.totalSolved} themLabel={peer.displayName} />
        <CompareMetricRow label="Topic mastery" you={you.avgMastery} them={peer.avgMastery} themLabel={peer.displayName} unit="%" />
        <CompareMetricRow label="Day streak" you={you.streak} them={peer.streak} themLabel={peer.displayName} />
        <CompareMetricRow label="Weekly activity" you={you.weeklyActivity} them={peer.weeklyActivity} themLabel={peer.displayName} />
        <CompareMetricRow label="Acceptance rate" you={you.acceptanceRate} them={peer.acceptanceRate} themLabel={peer.displayName} unit="%" />
      </div>

      {/* Difficulty */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Difficulty breakdown</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Easy', key: 'easy', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
            { label: 'Medium', key: 'medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Hard', key: 'hard', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          ].map((d) => (
            <div key={d.key} className={`rounded-xl border ${d.bg} p-3 text-center`}>
              <p className="text-[10px] font-bold uppercase text-slate-500">{d.label}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-xl font-black tabular-nums ${d.color}`}>{you[d.key]}</span>
                <span className="text-slate-300">vs</span>
                <span className={`text-xl font-black tabular-nums text-violet-600`}>{peer[d.key]}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 tabular-nums">
                Δ {deltas[d.key] > 0 ? '+' : ''}
                {deltas[d.key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Topic chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-sm font-bold text-slate-900">Topic mastery face-off</p>
          <p className="text-xs text-slate-500 mb-4">Biggest mastery gaps across shared topics</p>
          <div className="h-72 rounded-xl bg-white border border-slate-100 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="tag"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTag || ''}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="you" fill="#ea580c" name="You" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peer" fill="#8b5cf6" name={peer.displayName} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
