function CodeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function HeartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21s-6.7-4.35-9.33-8.07C.9 10.36 1.5 7.1 4.07 5.9c1.9-.9 4.06-.2 5.18 1.32L12 9.5l2.75-2.28c1.12-1.52 3.28-2.22 5.18-1.32 2.57 1.2 3.17 4.46 1.4 7.03C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden bg-slate-900 text-slate-300">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-7">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30">
              <CodeIcon className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">LeetCode Analytics</p>
              <p className="text-[11px] text-slate-400">Track · Compete · Grow</p>
            </div>
          </div>

          {/* Credits */}
          <div className="text-center sm:text-right">
            <p className="flex items-center justify-center gap-1.5 text-sm text-slate-200 sm:justify-end">
              <span className="inline-flex items-center gap-1 text-slate-400">
                Crafted with
                <HeartIcon className="h-3.5 w-3.5 text-rose-500" />
                by
              </span>
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
                Amit Vaghamshi
              </span>
              <span className="mx-1.5 text-slate-500">&amp;</span>
              <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
                Pravin Nikam
              </span>
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              Under the guidance of{' '}
              <span className="font-semibold text-slate-100">Dr. Pooja Sapra</span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />

        <p className="mt-4 text-center text-[11px] text-slate-500">
          © {year} LeetCode Analytics Portal · All rights reserved.
        </p>
      </div>
    </footer>
  );
}
