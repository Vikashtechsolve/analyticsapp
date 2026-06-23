import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

export default function ProgressChart({ history, variant }) {
  if (!history?.length || history.length < 2) return null;

  const data = history.map((h) => ({
    date: new Date(h.syncedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    fullDate: new Date(h.syncedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    solved: h.totalSolved,
    easy: h.easy,
    medium: h.medium,
    hard: h.hard,
  }));

  const latest = data[data.length - 1]?.solved ?? 0;
  const first = data[0]?.solved ?? 0;
  const growth = latest - first;
  const syncCount = data.length;
  const isActivity = variant === 'activity';

  return (
    <div className="space-y-5">
      <div className={`grid ${isActivity ? 'sm:grid-cols-3' : 'grid-cols-2'} gap-3`}>
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Current total</p>
          <p className="text-3xl font-black text-brand-700 tabular-nums mt-1">{latest}</p>
          <p className="text-[10px] text-slate-500 mt-1">Problems solved</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Growth</p>
          <p className="text-3xl font-black text-emerald-700 tabular-nums mt-1">
            {growth >= 0 ? '+' : ''}
            {growth}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Since first sync</p>
        </div>
        {isActivity && (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sync points</p>
            <p className="text-3xl font-black text-slate-800 tabular-nums mt-1">{syncCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">Classroom snapshots</p>
          </div>
        )}
      </div>

      <div className="h-56 sm:h-64 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-3 shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="solvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 13,
                boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
              formatter={(value, name) => [value, name === 'solved' ? 'Total solved' : name]}
            />
            <Area
              type="monotone"
              dataKey="solved"
              stroke="#ea580c"
              strokeWidth={2.5}
              fill="url(#solvedGrad)"
              name="solved"
              dot={{ r: 3, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 5, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {isActivity && latest > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Easy', val: data[data.length - 1]?.easy, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
            { label: 'Medium', val: data[data.length - 1]?.medium, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Hard', val: data[data.length - 1]?.hard, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          ].map((d) => (
            <div key={d.label} className={`rounded-xl border ${d.bg} px-4 py-2 flex items-center gap-2`}>
              <span className="text-xs font-semibold text-slate-600">{d.label}</span>
              <span className={`text-lg font-black tabular-nums ${d.color}`}>{d.val ?? 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
