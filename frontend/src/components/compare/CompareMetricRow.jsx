export default function CompareMetricRow({
  label,
  you,
  them,
  themLabel = 'Them',
  unit = '',
  higherIsBetter = true,
}) {
  const max = Math.max(you, them, 1);
  const youPct = Math.min(100, (you / max) * 100);
  const themPct = Math.min(100, (them / max) * 100);
  const delta = you - them;
  const youWin = higherIsBetter ? delta > 0 : delta < 0;
  const tie = delta === 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {!tie && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              youWin
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {youWin ? 'You lead' : `${themLabel} leads`}
          </span>
        )}
        {tie && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">
            Tied
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-brand-600">You</span>
            <span className="font-black text-slate-900 tabular-nums">
              {you}
              {unit}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-500 transition-all duration-700"
              style={{ width: `${youPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-violet-600">{themLabel}</span>
            <span className="font-black text-slate-900 tabular-nums">
              {them}
              {unit}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700"
              style={{ width: `${themPct}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-2.5 tabular-nums">
        Gap:{' '}
        <span className={`font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
          {delta > 0 ? '+' : ''}
          {delta}
          {unit}
        </span>
      </p>
    </div>
  );
}
