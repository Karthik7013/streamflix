import { PlayerSkeleton } from "@/components/streamflix-player/player-skeleton";

export default function WatchMovieLoading() {
  return (
    <div className="fixed inset-0 bg-black">
      <PlayerSkeleton />
    </div>
  );
}
