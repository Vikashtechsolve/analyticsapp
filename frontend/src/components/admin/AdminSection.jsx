const ACCENTS = {
  brand: 'from-brand-500 to-orange-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-yellow-500',
  violet: 'from-violet-500 to-purple-500',
  sky: 'from-sky-500 to-blue-500',
  rose: 'from-rose-500 to-pink-500',
  slate: 'from-slate-400 to-slate-600',
};

const ICON_BG = {
  brand: 'bg-brand-50 text-brand-600 border-brand-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminSection({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
  accent = 'brand',
  delay = 0,
  className = '',
  noPadding = false,
  headerAction,
}) {
  const hasHeader = eyebrow || title || subtitle || icon;

  return (
    <section
      className={`opacity-0 animate-fade-in-up rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`h-1 bg-gradient-to-r ${ACCENTS[accent] || ACCENTS.brand}`} />

      {hasHeader && (
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 min-w-0">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {icon && (
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ICON_BG[accent] || ICON_BG.brand}`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
                {title && <h2 className="admin-section-title">{title}</h2>}
                {subtitle && <p className="admin-section-desc">{subtitle}</p>}
              </div>
            </div>
            {headerAction && <div className="shrink-0 w-full sm:w-auto">{headerAction}</div>}
          </div>
        </div>
      )}

      <div className={noPadding ? '' : 'px-4 sm:px-6 py-4 sm:py-5'}>{children}</div>
    </section>
  );
}
