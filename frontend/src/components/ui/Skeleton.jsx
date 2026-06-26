export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

export function SkeletonText({ className = '' }) {
  return <Skeleton className={`h-3 ${className}`} />;
}
