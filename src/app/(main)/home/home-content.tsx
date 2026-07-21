"use client";

import { useFeatured } from "@/hooks/use-featured";
import { useTop10Movies } from "@/hooks/use-top10-movies";
import { useHomeWatchlist } from "@/hooks/use-home-watchlist";
import { HeroCarousel } from "@/components/hero-carousel";
import { Top10Row } from "@/app/(main)/home/top10-row";

import { WatchlistRow } from "@/app/(main)/home/watchlist-row";
export function HomeContent() {
  const featured = useFeatured();
  const top10 = useTop10Movies();
  const watchlist = useHomeWatchlist();

  return (
    <main>
      <section className="pb-14">
        <HeroCarousel {...featured} />
      </section>
      <section className="pb-6">
        <Top10Row {...top10} />
      </section>
      <section className="pb-6">
        <WatchlistRow {...watchlist} />
      </section>
    </main>
  );
}
