export default function DashboardSection({
  eyebrow,
  title,
  description,
  children,
  delay = 0,
  id,
}) {
  return (
    <section
      id={id}
      className="opacity-0 animate-fade-in-up space-y-5"
      style={{ animationDelay: `${delay}s` }}
    >
      {(eyebrow || title) && (
        <div className="flex flex-col gap-1">
          {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
          {title && <h2 className="section-title">{title}</h2>}
          {description && <p className="section-desc">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
