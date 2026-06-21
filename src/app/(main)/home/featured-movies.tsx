"use client";

import { useQuery } from "@tanstack/react-query";
import { HeroCarousel } from "@/components/hero-carousel";
import type { HeroCarouselItem } from "@/components/hero-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";

interface FeatureData {
  featured: HeroCarouselItem[];
}

async function fetchFeatured(): Promise<FeatureData> {
  const res = await fetch("/api/home/featured");
  if (!res.ok) throw new Error("Failed to fetch featured movies");
  return res.json();
}

export default function FeaturedMovies() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured"],
    queryFn: fetchFeatured,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="aspect-video md:aspect-21/9 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load featured movies." onRetry={refetch} />;
  }

  return <HeroCarousel items={data?.featured || []} />;
}
