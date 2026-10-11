"use client";

import { HeroCarousel } from "@/components/movie/hero-carousel";
import { HomeTop10Row } from "@/app/(main)/home/home-top10-row";
import { RequireAuth } from "@/components/layout/require-auth";
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
      <HeroCarousel data={featured} linkPrefix="/movies/" />
      <HomeTop10Row data={top10} />
      <RequireAuth>
        <Watchlist />
      </RequireAuth>
      <EndTagline />
    </main>
  );
}