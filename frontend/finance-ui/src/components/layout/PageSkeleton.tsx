import { Skeleton } from '@/components/Skeleton';

/**
 * What shows while a lazy route's code arrives (UI_UX_REVAMP_PLAN §6.1). The shell stays put
 * and the page area holds the shape of a page - a title line, a hero block, a few rows -
 * instead of going blank. Generic on purpose: it only has to say "the page is coming".
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-space-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-space-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-24 w-72" />
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
