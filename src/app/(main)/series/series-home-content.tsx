"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import HeroCarousel from "@/components/hero-carousel";
import { NumberSVG } from "@/components/number-svg";
import { SeriesCard } from "@/components/series-card";
import { STALE } from "@/lib/stale-times";
import { seriesApi } from "@/lib/api/series";
import type { SeriesHeroItem } from "@/services/featured-series";
import type { SeriesCardItem } from "@/services/series-recent";

export default function SeriesHomeContent() {
  const router = useRouter();

  const {
    data: featuredData,
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ["series-featured"],
    queryFn: async () => {
      const { featured } = await seriesApi.featured();
      return featured as SeriesHeroItem[];
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const {
    data: top10Data,
    isLoading: top10Loading,
    isError: top10Error,
    refetch: refetchTop10,
  } = useQuery({
    queryKey: ["series-top-10"],
    queryFn: async () => {
      const { top10 } = await seriesApi.top10();
      return top10 as SeriesCardItem[];
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const featured = featuredData ?? [];
  const top10 = top10Data ?? [];

  if (featuredLoading || top10Loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto space-y-12">
          <div>
            <Skeleton className="h-[75vh] w-full rounded-lg" />
          </div>
          <div className="px-4">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-48 space-y-2">
                  <Skeleton className="aspect-2/3 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (featuredError || top10Error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <ErrorState
          message={
            featuredError && top10Error
              ? "Unable to load series. Please check your connection."
              : featuredError
                ? "Unable to load featured series."
                : "Unable to load top 10 series."
          }
          onRetry={() => { refetchFeatured(); refetchTop10(); }}
        />
      </div>
    );
  }

  return (
    <>
      <section>
        <HeroCarousel items={featured} />
      </section>

      <section className="px-4 md:px-8 lg:px-12 pb-8">
        <h2 className="text-xl font-semibold mb-4">Trending Now · Top 10</h2>
        {top10.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">No featured series yet.</p>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden py-4 snap-x snap-mandatory scroll-pl-4">
            {top10.map((s, index) => (
              <div key={s.id} className="group shrink-0 snap-start">
                <div className="flex items-center">
                  <NumberSVG number={index + 1} />
                  <div className={`relative z-10 w-44 shrink-0 ${index > 0 ? "-ml-16" : "-ml-4"}`}>
                    <SeriesCard title={s.title} slug={s.slug} thumbnailUrl={s.thumbnailUrl} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
