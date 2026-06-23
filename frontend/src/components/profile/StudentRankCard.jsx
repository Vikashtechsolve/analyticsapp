import RankBadge from '../RankBadge';
import { rankMotivation } from '../../utils/rankUtils';

const METRIC_LABELS = {
  score: 'Overall Score',
  totalSolved: 'Problems Solved',
  streak: 'Day Streak',
  weeklyActivity: 'Weekly Activity',
};

function RankBlock({ label, rank, total, percentile, accent }) {
  if (!rank) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <p className="text-slate-600 text-sm">Not ranked yet</p>
      </div>
    );
  }

  const accents = {
    gold: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    brand: 'border-brand-200 bg-gradient-to-br from-brand-50 to-white',
  };

  return (
    <div className={`rounded-xl border p-4 ${accents[accent] || accents.brand}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <RankBadge rank={rank} total={total} size="xl" />
        <div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {rank}
            <span className="text-slate-500 text-base font-semibold"> / {total}</span>
          </p>
          {percentile != null && (
            <p className="text-sm text-slate-600 mt-0.5">
              Top <span className="text-brand-600 font-bold">{percentile}%</span> of class
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white border border-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500 transition-all duration-700"
          style={{ width: `${percentile ?? 0}%` }}
        />
      </div>
    </div>
  );
}

export default function StudentRankCard({ ranking }) {
  if (!ranking?.primary) return null;

  const { overall, division } = ranking.primary;
  const motivation = rankMotivation(overall?.rank, overall?.total);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm opacity-0 animate-fade-in-up">
      <div className="h-1 bg-gradient-to-r from-amber-400 to-brand-500" />
      <div className="relative p-4 sm:p-5">
        <div className="mb-4">
          <p className="section-eyebrow">Your rankings</p>
          <h2 className="text-lg font-bold text-slate-900">Classroom standing</h2>
          <p className="text-sm text-slate-600 mt-0.5">{motivation}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <RankBlock
            label="Overall Classroom"
            rank={overall?.rank}
            total={overall?.total}
            percentile={overall?.percentile}
            accent="gold"
          />
          <RankBlock
            label={division?.divisionName ? `${division.divisionName} Division` : 'Division'}
            rank={division?.rank}
            total={division?.total}
            percentile={division?.percentile}
            accent="brand"
          />
        </div>

        {ranking.byMetric && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ranks by category
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(METRIC_LABELS).map(([key, label]) => {
                const m = ranking.byMetric[key];
                return (
                  <div
                    key={key}
                    className="rounded-lg bg-white border border-slate-200 px-3 py-2 hover:border-brand-200 transition-colors"
                  >
                    <p className="text-[10px] text-slate-500 font-medium truncate">{label}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black text-slate-900 tabular-nums">
                        #{m?.overall?.rank ?? '—'}
                      </span>
                      {m?.overall?.total > 0 && (
                        <span className="text-[10px] text-slate-500">/ {m.overall.total}</span>
                      )}
                    </div>
                    {m?.division?.rank && (
                      <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
                        Div #{m.division.rank}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
