"use client";

import { HeroCarousel } from "@/components/hero-carousel";
import { Top10Row } from "@/app/(main)/home/top10-row";
import { RequireAuth } from "@/components/require-auth";
import { Watchlist } from "@/app/(main)/home/watchlist-row";
import { EndTagline } from "@/components/end-tagline";
import type { FeaturedItem, MovieCardData } from "@/types";

interface HomeContentProps {
  featured: FeaturedItem[];
  top10: MovieCardData[];
}

export function HomeContent({ featured, top10 }: HomeContentProps) {
  return (
    <main className="flex flex-col gap-14">
      <HeroCarousel data={featured} loading={false} isError={false} retry={() => {}} />
      <Top10Row data={top10} loading={false} isError={false} retry={() => {}} />
      <RequireAuth>
        <Watchlist />
      </RequireAuth>
      <EndTagline />
    </main>
  );
}
