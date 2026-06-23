import { Link } from 'react-router-dom';

export default function AdminShell({
  title,
  subtitle,
  backTo,
  backLabel = '← Dashboard',
  actions,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 mb-2"
            >
              {backLabel}
            </Link>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="section-eyebrow">Instructor Portal</p>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
              {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4">{children}</main>
    </div>
  );
}
