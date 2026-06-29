"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { HeroCarouselItem } from "@/components/hero-carousel";
import RecentMovies from "./recent-movies";
import HeroCarousel from "@/components/hero-carousel";
import type { HomeMovie } from "./types";

export default function HomeContent() {
  const { data: featuredData, isLoading: featuredLoading, isError: featuredError } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const res = await fetch("/api/home/featured");
      if (!res.ok) throw new Error("Failed to load featured movies.");
      return res.json() as Promise<{ featured: HeroCarouselItem[] }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const { data: recentData, isLoading: recentDataLoading, isError: recentdataError } = useQuery({
    queryKey: ["home-recently-added"],
    queryFn: async () => {
      const res = await fetch("/api/home/recently-added");
      if (!res.ok) throw new Error("Failed to load recently added.");
      return res.json() as Promise<{ recentlyAdded: HomeMovie[] }>;
    },
    staleTime: 0,
  });

  if (featuredError) {
    return (
      <div className="flex items-center justify-center p-12">
        <ErrorState message="Failed to load featured movies." />
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
