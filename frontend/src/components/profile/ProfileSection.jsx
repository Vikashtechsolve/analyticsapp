const ACCENTS = {
  brand: 'from-brand-500 to-orange-500',
  amber: 'from-amber-400 to-yellow-500',
  emerald: 'from-emerald-500 to-teal-500',
  violet: 'from-violet-500 to-purple-500',
  sky: 'from-sky-500 to-blue-500',
  rose: 'from-rose-500 to-pink-500',
};

const ICON_BG = {
  brand: 'bg-brand-50 text-brand-600 border-brand-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
};

export default function ProfileSection({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
  delay = 0,
  accent = 'brand',
  className = '',
  noPadding = false,
}) {
  return (
    <section
      className={`opacity-0 animate-fade-in-up rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`h-1.5 bg-gradient-to-r ${ACCENTS[accent] || ACCENTS.brand}`} />
      <div className={noPadding ? '' : 'p-5 sm:p-6'}>
        {(eyebrow || title || subtitle) && (
          <div className="flex items-start gap-4 mb-5 pb-4 border-b border-slate-100">
            {icon && (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm ${ICON_BG[accent] || ICON_BG.brand}`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
              {title && <h2 className="section-title">{title}</h2>}
              {subtitle && <p className="section-desc mt-1.5">{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
