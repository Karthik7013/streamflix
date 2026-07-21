import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-[300px] rounded-xl mt-4" />
    </div>
  );
}
