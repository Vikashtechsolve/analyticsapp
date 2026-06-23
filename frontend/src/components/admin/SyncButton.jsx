const formatEta = (seconds) => {
  if (!seconds || seconds < 1) return '';
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const mins = Math.ceil(seconds / 60);
  return mins === 1 ? '~1m' : `~${mins}m`;
};

export default function SyncButton({ progress, onClick }) {
  const busy = Boolean(progress && !progress.done && !progress.error);
  const { completed = 0, total = 0, startedAt, done, ok, fail, error } = progress || {};

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0;
  const etaSec = completed > 0 && completed < total ? (elapsed / completed) * (total - completed) : 0;
  const eta = formatEta(etaSec);

  let label = 'Sync LeetCode';
  if (error) label = error;
  else if (done) {
    label = fail > 0 ? `Done ${ok}/${total}` : `Done ✓ ${ok}/${total}`;
  } else if (busy && total > 0) {
    label = eta ? `${completed}/${total} · ${eta}` : `${completed}/${total}`;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="relative overflow-hidden btn-primary text-sm min-w-[8.5rem] px-4 py-2 disabled:cursor-wait"
    >
      {busy && total > 0 && (
        <span
          className="absolute inset-y-0 left-0 bg-brand-800/30 transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      )}
      <span className="relative z-10 font-semibold tabular-nums whitespace-nowrap">{label}</span>
    </button>
  );
}
