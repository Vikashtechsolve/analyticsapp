export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 border-b border-slate-200 bg-white animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-5">
        <div className="h-72 rounded-3xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
