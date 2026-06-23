import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function DailyActivityChart({ data }) {
  const formatted = (data || []).map((d) => ({
    ...d,
    label: d.date?.slice(5),
  }));

  const total = formatted.reduce((s, d) => s + (d.submissions || 0), 0);
  const peak = formatted.reduce((best, d) => ((d.submissions || 0) > best ? d.submissions : best), 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.08),transparent_60%)]" />

      <div className="relative px-5 pt-5 pb-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-500/90 mb-1">
            Activity
          </p>
          <h2 className="text-lg font-bold text-slate-900">Daily Submissions</h2>
          <p className="text-slate-500 text-xs mt-0.5">Classroom-wide · last 30 days</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xl font-black text-brand-400 tabular-nums">{total}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">total</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 tabular-nums">{peak}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">peak day</p>
          </div>
        </div>
      </div>

      <div className="relative h-56 sm:h-64 px-2 pb-4 pt-2">
        {formatted.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted}>
              <defs>
                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date}
              />
              <Area
                type="monotone"
                dataKey="submissions"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#colorSub)"
                name="Submissions"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-16">No submission data yet</p>
        )}
      </div>
    </div>
  );
}
