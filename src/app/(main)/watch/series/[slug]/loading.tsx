import { PlayerSkeleton } from "@/components/page-skeleton";

export default function WatchSeriesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <PlayerSkeleton />
    </div>
  );
}
