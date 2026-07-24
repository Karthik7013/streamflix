import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import { ErrorState } from "@/components/error-state";
import type { MovieCardData } from "@/types";

const SKELETON_ITEMS_5 = Array.from({ length: 5 }, (_, i) => i);

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
  if (data.length === 0 && !loading) return null;

  return (
    <section>
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-12">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Your Watchlist
        </h2>
        <Link
          href="/watchlist"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See All →
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
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden py-4 px-4 md:px-8 lg:px-12 snap-x snap-mandatory scroll-pl-4 no-scrollbar">
          {data.map((movie) => (
            <div key={movie.id} className="w-44 shrink-0 snap-start group relative">
              <MovieCard
                title={movie.title}
                slug={movie.slug}
                thumbnailUrl={movie.thumbnailUrl}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
