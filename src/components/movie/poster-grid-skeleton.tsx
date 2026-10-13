import { memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { skeletonItems } from "@/lib/skeletons";
import { cn } from "@/lib/utils";

export const PosterGridSkeleton = memo(function PosterGridSkeleton({
  count = 8,
  gridClassName,
  cardClassName = "aspect-2/3 rounded-lg",
}: {
  count?: number;
  gridClassName?: string;
  cardClassName?: string;
}) {
  const items = useMemo(() => skeletonItems(count), [count]);
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", gridClassName)}>
      {items.map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className={cardClassName} />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
});
