function masteryTone(pct) {
  if (pct < 40) return { bar: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-50 text-red-700 border-red-200' };
  if (pct < 60) return { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export default function TopicWeaknessTable({ topics, limit = 12 }) {
  const rows = (topics || []).slice(0, limit);

  if (!rows.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50">
        Topic mastery data appears after students are synced.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
              <th className="text-left py-3 pl-4 pr-3 w-8">#</th>
              <th className="text-left py-3 pr-4 min-w-[140px]">Topic</th>
              <th className="text-right py-3 pr-4 w-20">Mastery</th>
              <th className="text-right py-3 pr-4 w-24 hidden sm:table-cell">Students</th>
              <th className="text-left py-3 pr-4 min-w-[160px]">Strength</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const tone = masteryTone(t.classMastery);
              return (
                <tr key={t.tag} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                  <td className="py-3.5 pl-4 pr-3 text-xs font-bold text-slate-400 tabular-nums">{i + 1}</td>
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-slate-900 leading-snug break-words">{t.tag}</p>
                  </td>
                  <td className={`py-3.5 pr-4 text-right font-black tabular-nums ${tone.text}`}>
                    {t.classMastery}%
                  </td>
                  <td className="py-3.5 pr-4 text-right text-slate-600 tabular-nums hidden sm:table-cell">
                    {t.students}
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden min-w-[80px]">
                        <div
                          className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
                          style={{ width: `${Math.max(t.classMastery, 4)}%` }}
                        />
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border hidden sm:inline ${tone.badge}`}
                      >
                        {t.classMastery < 40 ? 'Weak' : t.classMastery < 60 ? 'Fair' : 'OK'}
                      </span>
                    </div>
                    <span
                      className={`inline-block sm:hidden mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${tone.badge}`}
                    >
                      {t.classMastery < 40 ? 'Weak' : t.classMastery < 60 ? 'Fair' : 'OK'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        Sorted weakest first · Class average mastery per topic
      </div>
    </div>
  );
}
