import { useMemo, useState } from 'react';

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function PeerPicker({ peers, selectedId, onSelect, loading, youName }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!peers?.length) return [];
    const q = query.trim().toLowerCase();
    if (!q) return peers;
    return peers.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(q) ||
        p.leetcodeUsername?.toLowerCase().includes(q) ||
        p.divisionName?.toLowerCase().includes(q)
    );
  }, [peers, query]);

  const selected = peers?.find((p) => String(p.studentId) === String(selectedId));

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-white p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Head-to-head</p>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">Compare with a classmate</h3>
          <p className="text-sm text-slate-600 mt-1">
            Pick any student in your classroom to see side-by-side stats.
          </p>
        </div>

        <div className="relative w-full sm:w-80 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={open ? query : selected?.displayName || ''}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={loading ? 'Loading classmates…' : 'Search by name or @username'}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
              disabled={loading}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              ⌕
            </span>
          </div>

          {open && !loading && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
              <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-slate-500">No classmates found</li>
                ) : (
                  filtered.map((p) => {
                    const isSelected = String(p.studentId) === String(selectedId);
                    return (
                      <li key={p.studentId}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(p.studentId);
                            setQuery('');
                            setOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            isSelected ? 'bg-violet-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
                            {initials(p.displayName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{p.displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              @{p.leetcodeUsername}
                              {p.divisionName && ` · ${p.divisionName}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-slate-800 tabular-nums">#{p.rank}</p>
                            <p className="text-[10px] text-slate-500">{p.totalSolved} solved</p>
                          </div>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {selected && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-100 bg-white px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
            {initials(selected.displayName)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{youName}</span>
              <span className="mx-2 text-slate-400">vs</span>
              <span className="font-bold text-violet-700">{selected.displayName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Rank #{selected.rank} · {selected.totalSolved} solved · {selected.avgMastery}% mastery
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
