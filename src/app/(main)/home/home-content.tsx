"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { STALE } from "@/lib/stale-times";
import { homeApi } from "@/lib/api/home";
import RecentMovies from "./recent-movies";
import type { MovieCardData } from "@/types";
import HeroCarousel from "@/components/hero-carousel";

export default function HomeContent() {
  const {
    data: featuredData,
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ["home-featured"],
    queryFn: () => homeApi.featured(),
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const {
    data: recentData,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ["home-recently-added"],
    queryFn: () => homeApi.recentlyAdded(),
    staleTime: STALE.NEVER,
  });

  if (featuredLoading || recentLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto space-y-12 p-4">
          <div>
            <Skeleton className="h-[60vh] w-full rounded-lg" />
          </div>
          <div>
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

  if (featuredError || recentError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <ErrorState
          message={
            featuredError && recentError
              ? "Failed to load content. Check your connection."
              : featuredError
                ? "Failed to load featured movies."
                : "Failed to load recently added movies."
          }
          onRetry={() => {
            refetchFeatured();
            refetchRecent();
          }}
        />
      </div>
    );
  }

  return (
    <>
      <section className="pb-6">
        <HeroCarousel items={featuredData?.items ?? []} />
      </section>
      <RecentMovies movies={(recentData?.movies ?? []) as MovieCardData[]} />
    </>
  );
}
