"use client";

import { HeroCarousel } from "@/components/hero-carousel";
import { Top10Row } from "@/app/(main)/series/top10-row";
import { useSeriesFeatured } from "@/hooks/use-series-featured";
import { useSeriesTop10 } from "@/hooks/use-series-top10";

export function SeriesHomeContent() {
  const featured = useSeriesFeatured();
  const top10 = useSeriesTop10();

  return (
    <main>
      <section className="pb-14">
        <HeroCarousel {...featured} linkPrefix="/series/" />
      </section>

      <section className="pb-6">
        <Top10Row {...top10} />
      </section>
    </main>
  );
}
