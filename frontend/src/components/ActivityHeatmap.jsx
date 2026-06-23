import { useMemo, useState } from 'react';

const WEEKS = 52;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatUtcDate = (d) => d.toISOString().slice(0, 10);

const addUtcDays = (d, n) => {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
};

const formatDisplayDate = (dateStr) =>
  new Date(dateStr + 'T00:00:00Z').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const buildGrid = (calendar) => {
  const cal = calendar || {};
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const start = addUtcDays(end, -(WEEKS * 7 - 1));
  const startDow = start.getUTCDay();
  const alignedStart = addUtcDays(start, -startDow);

  const days = [];
  let cur = new Date(alignedStart);
  while (cur <= end) {
    const dateStr = formatUtcDate(cur);
    days.push({
      date: dateStr,
      count: Number(cal[dateStr]) || 0,
      month: cur.getUTCMonth(),
    });
    cur = addUtcDays(cur, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabels = weeks.map((week, wi) => {
    const first = week[0];
    if (!first) return { label: '', show: false, weekIndex: wi };
    const prevWeek = weeks[wi - 1];
    const prevMonth = prevWeek?.[0]?.month;
    const show = wi === 0 || first.month !== prevMonth;
    return { label: MONTHS[first.month], show, weekIndex: wi };
  });

  let totalSubmissions = 0;
  let activeDays = 0;
  let maxCount = 0;
  for (const d of days) {
    totalSubmissions += d.count;
    if (d.count > 0) activeDays++;
    if (d.count > maxCount) maxCount = d.count;
  }

  return { weeks, monthLabels, totalSubmissions, activeDays, maxCount, dayCount: days.length };
};

const getLevel = (count, max) => {
  if (!count) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
};

const LEVEL_CLASS = {
  0: 'bg-slate-100 border-slate-200/80',
  1: 'bg-brand-200 border-brand-300/80',
  2: 'bg-brand-400 border-brand-500/80',
  3: 'bg-brand-500 border-brand-600/80',
  4: 'bg-brand-600 border-brand-700/80',
};

function TooltipBar({ tooltip }) {
  return (
    <div
      className="h-14 rounded-xl border border-slate-200 bg-white px-4 flex items-center gap-3 shadow-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {tooltip ? (
        <>
          <div
            className={`h-8 w-8 rounded-lg border shrink-0 ${LEVEL_CLASS[getLevel(tooltip.count, tooltip.maxCount)]}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 tabular-nums">
              {tooltip.count} submission{tooltip.count !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-500 truncate">{formatDisplayDate(tooltip.date)}</p>
          </div>
          {tooltip.count > 0 && (
            <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-100">
              Active day
            </span>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400">
          Hover or focus a square to see submissions for that day
        </p>
      )}
    </div>
  );
}

export default function ActivityHeatmap({ calendar, streak, variant }) {
  const [tooltip, setTooltip] = useState(null);
  const grid = useMemo(() => buildGrid(calendar), [calendar]);
  const hasData = grid.totalSubmissions > 0 || grid.activeDays > 0;
  const isActivity = variant === 'activity';

  const showTooltip = (day) =>
    setTooltip({ date: day.date, count: day.count, maxCount: grid.maxCount });

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center py-14 px-6">
        <span className="text-4xl mb-3 block" aria-hidden>
          📅
        </span>
        <p className="text-slate-800 font-semibold">No activity in the last year</p>
        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
          Submission history loads after a classroom sync from LeetCode.
        </p>
      </div>
    );
  }

  const avgPerActiveDay =
    grid.activeDays > 0 ? Math.round((grid.totalSubmissions / grid.activeDays) * 10) / 10 : 0;

  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-2 ${isActivity ? 'lg:grid-cols-4' : ''} gap-3`}>
        {[
          {
            label: 'Submissions',
            value: grid.totalSubmissions,
            hint: 'Last 52 weeks',
            color: 'text-brand-600',
            bg: 'from-brand-50 to-white',
            border: 'border-brand-100',
          },
          {
            label: 'Active days',
            value: grid.activeDays,
            hint: 'Days with ≥1 submission',
            color: 'text-slate-800',
            bg: 'from-slate-50 to-white',
            border: 'border-slate-200',
          },
          ...(streak != null
            ? [
                {
                  label: 'Current streak',
                  value: streak,
                  hint: 'Consecutive days',
                  color: 'text-amber-600',
                  bg: 'from-amber-50 to-white',
                  border: 'border-amber-100',
                },
              ]
            : []),
          {
            label: 'Avg / active day',
            value: avgPerActiveDay,
            hint: 'Submissions per coding day',
            color: 'text-emerald-600',
            bg: 'from-emerald-50 to-white',
            border: 'border-emerald-100',
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.bg} p-4 opacity-0 animate-scale-in`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
            <p className={`text-2xl sm:text-3xl font-black tabular-nums mt-1 ${stat.color}`}>
              {stat.value}
            </p>
            {isActivity && <p className="text-[10px] text-slate-500 mt-1">{stat.hint}</p>}
          </div>
        ))}
      </div>

      {/* Fixed-height tooltip — always in DOM, prevents page jump */}
      <TooltipBar tooltip={tooltip} />

      <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-4 sm:p-5 overflow-x-auto">
        <div className="inline-block min-w-0">
          <div className="flex mb-2 ml-9" style={{ gap: '3px' }}>
            {grid.weeks.map((_, wi) => {
              const ml = grid.monthLabels[wi];
              return (
                <div
                  key={wi}
                  className="text-[10px] font-medium text-slate-500 shrink-0"
                  style={{ width: 14 }}
                >
                  {ml?.show ? ml.label : ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            <div className="flex flex-col shrink-0" style={{ gap: '3px' }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="text-[9px] font-medium text-slate-500 flex items-center"
                  style={{ height: 14, width: 28 }}
                >
                  {i % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            <div
              className="flex"
              style={{ gap: '3px' }}
              role="grid"
              aria-label="Submission activity heatmap"
              onMouseLeave={() => setTooltip(null)}
            >
              {grid.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: '3px' }} role="row">
                  {week.map((day) => {
                    const level = getLevel(day.count, grid.maxCount);
                    const isActive = tooltip?.date === day.date;
                    return (
                      <div
                        key={day.date}
                        role="gridcell"
                        tabIndex={0}
                        className={`rounded-[3px] border cursor-default transition-colors outline-none ${LEVEL_CLASS[level]} ${
                          isActive
                            ? 'ring-2 ring-brand-500 ring-offset-1 z-10 relative'
                            : 'hover:ring-2 hover:ring-brand-400/70 hover:ring-offset-1 hover:z-10 hover:relative'
                        }`}
                        style={{ width: 14, height: 14 }}
                        onMouseEnter={() => showTooltip(day)}
                        onFocus={() => showTooltip(day)}
                        onBlur={(e) => {
                          if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                            setTooltip(null);
                          }
                        }}
                        aria-label={`${formatDisplayDate(day.date)}: ${day.count} submissions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`rounded-[3px] border ${LEVEL_CLASS[level]}`}
              style={{ width: 14, height: 14 }}
            />
          ))}
          <span className="font-medium">More</span>
        </div>
        <p className="text-[11px] text-slate-400">Each square = one day · Last {WEEKS} weeks</p>
      </div>
    </div>
  );
}
