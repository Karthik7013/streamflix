"use client";

import { useFeatured } from "@/hooks/use-featured";
import { useRecentMovies } from "@/hooks/use-recent-movies";
import { useWatchlist } from "@/hooks/use-watchlist";
import { HeroCarouselPresenter } from "@/components/hero-carousel";
import RecentMovies from "@/app/(main)/home/recent-movies";
import WatchlistRow from "@/app/(main)/home/watchlist-row";

export default function HomeContent() {
  const featured = useFeatured();
  const recent = useRecentMovies();
  const watchlist = useWatchlist();

  return (
    <main>
      <section className="pb-6">
        <HeroCarouselPresenter {...featured} />
      </section>
      <section className="pb-6">
        <RecentMovies {...recent} />
      </section>
      <section className="pb-6">
        <WatchlistRow {...watchlist} />
      </section>
    </main>
  );
}
