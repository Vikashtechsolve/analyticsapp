const typeLabel = {
  practice: 'Practice',
  improve: 'Improve',
  revision: 'Revision',
  challenge: 'Challenge',
  'revise-topic': 'Revise',
  maintain: 'Maintain',
};

const typeIcon = {
  practice: '📝',
  improve: '📈',
  revision: '🔄',
  challenge: '🏆',
  'revise-topic': '🎯',
  maintain: '✨',
};

const priorityStyle = {
  high: {
    border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    bg: 'bg-gradient-to-r from-red-50/90 via-white to-white',
    ring: 'ring-red-100',
  },
  medium: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bg: 'bg-gradient-to-r from-amber-50/90 via-white to-white',
    ring: 'ring-amber-100',
  },
  low: {
    border: 'border-l-slate-400',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    bg: 'bg-gradient-to-r from-slate-50 to-white',
    ring: 'ring-slate-100',
  },
};

export default function NextSteps({ steps }) {
  if (!steps?.length) return null;

  return (
    <section className="opacity-0 animate-fade-in-up rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50/80 via-white to-amber-50/40 shadow-md overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-brand-500 via-orange-500 to-amber-400" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 text-white text-xl shadow-lg shadow-brand-200/50">
            ✦
          </div>
          <div className="flex-1">
            <p className="section-eyebrow">Your action plan</p>
            <h2 className="section-title">What to do next</h2>
            <p className="section-desc mt-1">
              Personalized recommendations based on your streak, mastery gaps, and revision schedule.
              Pick one and start today.
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white/80 border border-brand-100 px-3 py-2 text-center sm:text-right">
            <p className="text-2xl font-black text-brand-600 tabular-nums">{steps.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Steps</p>
          </div>
        </div>
        <ul className="space-y-3">
          {steps.map((step, i) => {
            const style = priorityStyle[step.priority] || priorityStyle.low;
            const icon = typeIcon[step.type] || '💡';
            return (
              <li
                key={i}
                className={`flex gap-4 rounded-2xl border border-slate-200 border-l-[4px] ${style.border} ${style.bg} ring-1 ${style.ring} px-4 py-4 opacity-0 animate-slide-in-right hover:shadow-md transition-shadow`}
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-lg shadow-sm">
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border bg-white/80 text-slate-500">
                      Step {i + 1}
                    </span>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${style.badge}`}>
                      {typeLabel[step.type] || 'Tip'}
                    </span>
                    {step.priority === 'high' && (
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
