import Link from "next/link";
import { Bookmark } from "lucide-react";
import { MovieCard } from "@/components/movie-card";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
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
        <SectionHeader title="Your Watchlist" seeAllHref="/watchlist" className="px-4 md:px-8 lg:px-12" />
        <EmptyState
          icon={<Bookmark className="size-8 text-muted-foreground" />}
          title="Your watchlist is empty."
          description={
            <>
              Save movies to find them here later.{" "}
              <Link href="/explore" className="text-primary hover:underline">
                Browse movies
              </Link>.
            </>
          }
          className="py-10 px-4"
        />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Your Watchlist" seeAllHref="/watchlist" className="px-4 md:px-8 lg:px-12" />
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
