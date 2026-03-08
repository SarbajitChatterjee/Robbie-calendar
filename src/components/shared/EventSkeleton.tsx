/**
 * EventSkeleton — Loading placeholder components for event lists.
 *
 * EventCardSkeleton: mimics the shape of a single EventCard.
 * EventListSkeleton: renders multiple card skeletons for list loading states.
 */

import { Skeleton } from "@/components/ui/skeleton";

/** Single event card loading skeleton — matches EventCard layout. */
export function EventCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-[var(--radius-card)] bg-card p-4 shadow-[0_2px_8px_hsl(var(--shadow-soft))]">
      <Skeleton className="w-1 h-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/** Renders `count` card skeletons as a loading state for event lists. */
export function EventListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
