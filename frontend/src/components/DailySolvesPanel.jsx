import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const DIFF_BADGE = {
  Easy: 'bg-green-50 text-green-700 border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-red-50 text-red-700 border-red-200',
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShort = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function DailySolvesPanel({ dailySolves, variant }) {
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!dailySolves?.byDate?.length) return;
    const dates = dailySolves.byDate.map((d) => d.date);
    if (!selectedDate || !dates.includes(selectedDate)) {
      setSelectedDate(dailySolves.byDate[0].date);
    }
  }, [dailySolves, selectedDate]);

  const activeDate = selectedDate || dailySolves?.byDate?.[0]?.date || '';

  if (!dailySolves?.byDate?.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">
        No date-wise solve history yet. Run a sync to capture recent accepted submissions.
      </p>
    );
  }

  const selected = dailySolves.byDate.find((d) => d.date === activeDate);
  const chartData = [...dailySolves.summary].reverse().slice(-30);
  const isOverview = variant === 'overview';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border px-4 sm:px-5 py-3 ${isOverview ? 'bg-gradient-to-br from-brand-50 to-white border-brand-100 shadow-sm' : 'bg-brand-50 border-brand-100'}`}>
          <p className="text-2xl sm:text-3xl font-black text-brand-600 tabular-nums">{dailySolves.byDate.length}</p>
          <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider mt-0.5">Coding days</p>
          <p className="text-[10px] text-slate-500 mt-1">Days with at least one solve</p>
        </div>
        <div className={`rounded-2xl border px-4 sm:px-5 py-3 ${isOverview ? 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 tabular-nums">{dailySolves.totalLogged}</p>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Problems logged</p>
          <p className="text-[10px] text-slate-500 mt-1">Tracked in your daily journal</p>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className={`${isOverview ? 'h-44' : 'h-40'} rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-3 shadow-inner`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 9 }}
                interval={4}
                tickFormatter={(d) => d.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                labelFormatter={(d) => `Date: ${d}`}
              />
              <Bar dataKey="problemsSolved" fill="#ea580c" name="Solved" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {isOverview ? 'Browse your coding days' : 'Pick a date'}
          </p>
          <div className={`max-h-80 overflow-y-auto rounded-2xl border border-slate-200 ${isOverview ? 'bg-white shadow-sm' : 'bg-slate-50'} divide-y divide-slate-100`}>
            {dailySolves.byDate.map((day) => {
              const active = activeDate === day.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-all ${
                    active
                      ? 'bg-gradient-to-r from-brand-50 to-white border-l-[3px] border-l-brand-500'
                      : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-slate-800'}`}>
                      {formatShort(day.date)}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{day.date}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                      active ? 'bg-brand-600 text-white' : 'bg-white text-brand-600 border border-brand-100'
                    }`}
                  >
                    {day.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {activeDate ? formatDate(activeDate) : 'Problems'}
          </p>
          {selected?.problems?.length ? (
            <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {selected.problems.map((p, i) => {
                const diff = p.difficulty || 'Medium';
                const badge = DIFF_BADGE[diff] || DIFF_BADGE.Medium;
                return (
                  <li
                    key={`${p.slug}-${i}`}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div className="min-w-0 flex-1">
                      {p.slug ? (
                        <a
                          href={`https://leetcode.com/problems/${p.slug}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-800 hover:text-brand-600 transition-colors"
                        >
                          {p.title}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                      )}
                      {p.tags?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {p.tags.slice(0, 4).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge}`}>
                      {diff}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center bg-slate-50">
              <p className="text-slate-500 text-sm">No problems for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
