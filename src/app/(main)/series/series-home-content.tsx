"use client";

import { useRouter } from "next/navigation";
import { HeroCarousel } from "@/components/hero-carousel";
import { Top10Row } from "@/app/(main)/series/top10-row";
import { useSeriesFeatured } from "@/hooks/use-series-featured";
import { useSeriesTop10 } from "@/hooks/use-series-top10";

export function SeriesHomeContent() {
  const router = useRouter();
  const featured = useSeriesFeatured();
  const top10 = useSeriesTop10();

  return (
    <>
      <section>
        <HeroCarousel {...featured} linkPrefix="/series/" />
      </section>

      <Top10Row {...top10} />

      <div className="px-4 md:px-8 lg:px-12 pb-8">
        <button
          onClick={() => router.push("/series/explore")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse All Series →
        </button>
      </div>
    </>
  );
}
