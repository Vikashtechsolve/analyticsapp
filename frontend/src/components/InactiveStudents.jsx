import { useState } from 'react';

const COLLAPSED_COUNT = 24;
const LIST_HEIGHT = 'h-40'; // fixed — same height collapsed or expanded

function AlertIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function InactiveStudents({ students }) {
  const [expanded, setExpanded] = useState(false);

  if (!students?.length) return null;

  const hasMore = students.length > COLLAPSED_COUNT;
  const visible = expanded ? students : students.slice(0, COLLAPSED_COUNT);
  const hiddenCount = students.length - COLLAPSED_COUNT;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <AlertIcon className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-amber-800">
            Inactive 7+ days
            <span className="ml-1.5 rounded-full bg-amber-200/70 px-2 py-0.5 text-xs font-bold text-amber-800">
              {students.length}
            </span>
          </p>
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            {expanded ? 'Show less' : `Show all (${students.length})`}
          </button>
        )}
      </div>

      <div className={`relative mt-2.5 ${LIST_HEIGHT}`}>
        <div
          className={`h-full overflow-y-auto pr-1 ${
            !expanded && hasMore ? 'overflow-hidden' : ''
          }`}
        >
          <div className="flex flex-wrap gap-1.5">
            {visible.map((s) => (
              <span
                key={s.studentId}
                className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                {s.displayName}
              </span>
            ))}
            {!expanded && hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="rounded-lg border border-dashed border-amber-300 bg-amber-100/50 px-2 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
              >
                +{hiddenCount} more
              </button>
            )}
          </div>
        </div>

        {/* Fade hint when collapsed and list overflows */}
        {!expanded && hasMore && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-amber-50/95 to-transparent"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
