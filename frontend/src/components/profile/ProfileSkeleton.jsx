import { Skeleton } from '../ui/Skeleton';

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-12 space-y-5">
        {/* Hero */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <Skeleton className="h-4 w-32 mb-5" />
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Rank card */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Tabs */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>

        {/* Overview content */}
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid xl:grid-cols-5 gap-5">
          <Skeleton className="h-72 xl:col-span-3 rounded-2xl" />
          <div className="xl:col-span-2 space-y-5">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
