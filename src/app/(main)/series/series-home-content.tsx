"use client";

import { HeroCarousel } from "@/components/hero-carousel";
import { Top10Row } from "@/app/(main)/series/top10-row";
import { useSeriesFeatured } from "@/hooks/use-series-featured";
import { useSeriesTop10 } from "@/hooks/use-series-top10";

export function SeriesHomeContent() {
  const featured = useSeriesFeatured();
  const top10 = useSeriesTop10();

  return (
    <main className="flex flex-col gap-14">
      <HeroCarousel {...featured} linkPrefix="/series/" />
      <Top10Row {...top10} />
    </main>
  );
}
