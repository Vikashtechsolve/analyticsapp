export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="h-44 rounded-2xl bg-white border border-slate-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="h-10 w-full max-w-md rounded-lg bg-white" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-white border border-slate-200" />
          <div className="h-64 rounded-xl bg-white border border-slate-200" />
        </div>
      </div>
    </div>
  );
}
