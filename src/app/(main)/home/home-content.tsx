"use client";

import { useFeatured } from "@/hooks/use-featured";
import { useTop10Movies } from "@/hooks/use-top10-movies";
import { HeroCarousel } from "@/components/hero-carousel";
import { Top10Row } from "@/app/(main)/home/top10-row";
import { RequireAuth } from "@/components/require-auth";
import { Watchlist } from "@/app/(main)/home/watchlist-row";
import { EndTagline } from "@/components/end-tagline";
export function HomeContent() {
  const featured = useFeatured();
  const top10 = useTop10Movies();


  return (
    <main className="flex flex-col gap-14">
      <HeroCarousel {...featured} />
      <Top10Row {...top10} />
      <RequireAuth>
        <Watchlist />
      </RequireAuth>
      <EndTagline />
    </main>
  );
}
