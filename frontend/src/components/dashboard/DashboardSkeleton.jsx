import { Skeleton } from '../ui/Skeleton';
import DashboardContentSkeleton from './DashboardContentSkeleton';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <DashboardContentSkeleton />
      </main>
    </div>
  );
}
