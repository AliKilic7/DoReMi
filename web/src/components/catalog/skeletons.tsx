import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton({ round = false }: { round?: boolean }) {
  return (
    <div className="p-3">
      <Skeleton className={round ? "aspect-square rounded-full" : "aspect-square rounded-xl"} />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function ShelfSkeleton({ round = false }: { round?: boolean }) {
  return (
    <section className="mt-8 first:mt-0">
      <Skeleton className="mx-3 mb-2 h-6 w-44" />
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} round={round} />
        ))}
      </div>
    </section>
  );
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="size-8 rounded-lg" />
      <Skeleton className="size-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function CardGridSkeleton({ count = 12, round = false }: { count?: number; round?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} round={round} />
      ))}
    </div>
  );
}
