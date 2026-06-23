const STYLES = {
  brand: { bar: 'from-brand-500 to-orange-500', bg: 'bg-brand-50 border-brand-100', text: 'text-brand-700' },
  violet: { bar: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 border-violet-100', text: 'text-violet-700' },
  emerald: { bar: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  amber: { bar: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
  rose: { bar: 'from-rose-500 to-red-600', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700' },
  sky: { bar: 'from-sky-500 to-blue-500', bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700' },
  slate: { bar: 'from-slate-400 to-slate-600', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-800' },
};

export default function AdminStatCard({ label, value, accent = 'brand', delay = 0, compact = false }) {
  const s = STYLES[accent] || STYLES.brand;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border min-w-0 ${compact ? 'p-3' : 'p-4'} ${s.bg} opacity-0 animate-scale-in`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.bar}`} />
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</p>
      <p
        className={`font-black tabular-nums truncate ${compact ? 'text-xl mt-0.5' : 'text-2xl sm:text-3xl mt-1'} ${s.text}`}
      >
        {value}
      </p>
    </div>
  );
}
