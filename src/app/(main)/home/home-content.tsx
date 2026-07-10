"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { STALE } from "@/lib/stale-times";
import { homeApi } from "@/lib/api/home";
import RecentMovies from "@/app/(main)/home/recent-movies";
import CategoryRows from "@/app/(main)/home/category-rows";
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

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["home-categories"],
    queryFn: () => homeApi.categories(),
    staleTime: STALE.HOUR,
    refetchOnMount: false,
  });

  const categories = categoriesData?.categories ?? [];

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
              ? "Unable to load content. Please check your connection."
              : featuredError
                ? "Unable to load featured titles."
                : "Unable to load recent titles."
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
      {categoriesLoading ? (
        <div className="space-y-8 pb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-32 mx-4 md:mx-8 lg:mx-12 mb-4" />
              <div className="flex gap-3 overflow-hidden px-4 md:px-8 lg:px-12">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-40 shrink-0 space-y-2">
                    <Skeleton className="aspect-[2/3] rounded-lg" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CategoryRows categories={categories} />
      )}
      <RecentMovies movies={(recentData?.recentlyAdded ?? []) as MovieCardData[]} />
    </>
  );
}
