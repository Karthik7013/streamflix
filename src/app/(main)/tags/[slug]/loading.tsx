import { Skeleton } from "@/components/ui/skeleton";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS_8 = skeletonItems(8);

export default function TagLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="aspect-[3/1] sm:aspect-[4/1] rounded-2xl" />
      <div className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {SKELETON_ITEMS_8.map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-2/3 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
