import Link from "next/link";
import { Bookmark } from "lucide-react";
import { MovieCard } from "@/components/movie-card";
import { ErrorState } from "@/components/error-state";
import { MediaCarousel } from "@/components/media-carousel";
import type { MovieCardData } from "@/types";
import { useHomeWatchlist } from "@/hooks/use-home-watchlist";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS_5 = skeletonItems(5);


export function Watchlist() {
  const watchlist = useHomeWatchlist();
  return (
    <WatchlistRow {...watchlist} />
  )
}

export function WatchlistRow({
  data,
  loading,
  isError,
  retry,
}: {
  data: MovieCardData[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  if (isError) return <ErrorState message="Unable to load your watchlist." onRetry={retry} />;
  if (data.length === 0 && !loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4 px-4 md:px-8 lg:px-12">
          <h2 className="text-lg font-semibold font-heading flex items-center gap-2">
            Your Watchlist
          </h2>
          <Link
            href="/watchlist"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            See All
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Bookmark className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold font-heading">Your watchlist is empty.</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Save movies and series to find them here later.{" "}
            <Link href="/explore" className="text-primary hover:underline">
              Browse movies
            </Link>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-4 md:px-8 lg:px-12">
        <h2 className="text-lg font-semibold font-heading flex items-center gap-2">
          Your Watchlist
        </h2>
        <Link
          href="/watchlist"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See All
        </Link>
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-hidden py-4 px-4 md:px-8 lg:px-12">
          {SKELETON_ITEMS_5.map((i) => (
            <div key={i} className="w-44 shrink-0 space-y-2">
              <div className="aspect-2/3 rounded-lg bg-muted animate-pulse" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <MediaCarousel
          className="px-4 md:px-8 lg:px-12 py-4"
          slideClassName="shrink-0 grow-0 basis-auto pl-3"
        >
          {data.map((movie) => (
            <div key={movie.id} className="group relative w-44">
              <MovieCard
                title={movie.title}
                slug={movie.slug}
                thumbnailUrl={movie.thumbnailUrl}
              />
            </div>
          ))}
        </MediaCarousel>
      )}
    </section>
  );
}
