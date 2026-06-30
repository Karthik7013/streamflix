"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { HeroCarouselItem } from "@/components/hero-carousel";
import RecentMovies from "./recent-movies";
import HeroCarousel from "@/components/hero-carousel";
import type { HomeMovie } from "./types";

export default function HomeContent() {
  const {
    data: featuredData,
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const res = await fetch("/api/home/featured");
      if (!res.ok) throw new Error("Failed to load featured movies.");
      return res.json() as Promise<{ featured: HeroCarouselItem[] }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const {
    data: recentData,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ["home-recently-added"],
    queryFn: async () => {
      const res = await fetch("/api/home/recently-added");
      if (!res.ok) throw new Error("Failed to load recently added.");
      return res.json() as Promise<{ recentlyAdded: HomeMovie[] }>;
    },
    staleTime: 0,
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
        <HeroCarousel items={featuredData?.featured ?? []} />
      </section>
      <RecentMovies movies={recentData?.recentlyAdded ?? []} />
    </>
  );
}
