import { Skeleton } from '../ui/Skeleton';

export default function DashboardContentSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in" aria-hidden>
      {/* Hall of fame / podium */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-8 w-56 rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
          <Skeleton className="h-48 sm:h-52 w-full sm:w-[30%] rounded-2xl" />
          <Skeleton className="h-56 sm:h-64 w-full sm:w-[34%] rounded-2xl" />
          <Skeleton className="h-44 sm:h-48 w-full sm:w-[30%] rounded-2xl" />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 pt-5 pb-4 border-b border-slate-200 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-52" />
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-8 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>

      {/* Inactive */}
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
