import { useMemo } from 'react';

export default function TopicChart({ topics }) {
  const data = useMemo(() => (topics || []).slice(0, 10), [topics]);

  const stats = useMemo(() => {
    const total = data.reduce((s, t) => s + t.count, 0);
    const max = data[0]?.count || 1;
    return { total, max, count: data.length };
  }, [data]);

  if (!data.length) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 h-full min-h-[320px] flex flex-col">
        <div className="relative flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium text-sm">No topic data yet</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs">
            Sync the classroom to populate topic coverage from student solves.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white h-full flex flex-col shadow-sm">
      <div className="relative shrink-0 px-5 pt-5 pb-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Topic Coverage</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {stats.count} topics · {stats.total} total solves
            </p>
          </div>
          <div className="text-right shrink-0 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Leading</p>
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{data[0]?.tag}</p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 max-h-[min(380px,50vh)] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="text-left font-medium py-2.5 pl-5 pr-2 w-8">#</th>
              <th className="text-left font-medium py-2.5 pr-3">Topic</th>
              <th className="text-right font-medium py-2.5 pr-3 w-14">Solves</th>
              <th className="text-right font-medium py-2.5 pr-5 w-14">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((topic, i) => {
              const pctOfMax = Math.round((topic.count / stats.max) * 100);
              const share = stats.total > 0 ? Math.round((topic.count / stats.total) * 100) : 0;
              const barOpacity = Math.max(0.35, 1 - i * 0.07);

              return (
                <tr
                  key={topic.tag}
                  className="border-b border-slate-200 hover:bg-slate-100 transition-colors group"
                >
                  <td className="py-3 pl-5 pr-2 text-xs font-medium text-slate-600 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-slate-800 font-medium truncate group-hover:text-slate-900 transition-colors">
                        {topic.tag}
                      </span>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{
                            width: `${Math.max(pctOfMax, 6)}%`,
                            opacity: barOpacity,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold text-slate-700 tabular-nums">
                    {topic.count}
                  </td>
                  <td className="py-3 pr-5 text-right text-slate-500 tabular-nums text-xs">
                    {share}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 px-5 py-2.5 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span className="inline-block w-8 h-1.5 rounded-full bg-brand-500" />
          <span>Bar length = relative volume · darker rows = lower rank</span>
        </div>
      </div>
    </div>
  );
}
