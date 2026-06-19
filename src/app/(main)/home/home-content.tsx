"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HeroCarousel } from "@/components/hero-carousel";
import type { HeroCarouselItem } from "@/components/hero-carousel";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";

interface HomeMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  progressSeconds?: number;
  durationSeconds?: number;
}

interface HomeData {
  featured: HeroCarouselItem[];
  continueWatching: HomeMovie[];
  recentlyAdded: HomeMovie[];
}

async function fetchHome(): Promise<HomeData> {
  const res = await fetch("/api/home");
  if (!res.ok) throw new Error("Failed to fetch home data");
  return res.json();
}

export function HomeContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
    refetchOnMount: false,
  });

  if (isError) {
    return <p className="text-muted-foreground text-center py-12">Failed to load home data. Please try again.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="aspect-video md:aspect-[21/9] rounded-xl" />
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || (data.featured?.length === 0 && data.continueWatching?.length === 0 && data.recentlyAdded?.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Film className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Welcome to StreamFlix!</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          No movies available yet. Check back soon or browse our collection.
        </p>
        <Link href="/explore">
          <Button>Browse Movies</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="pb-6">
        <HeroCarousel items={data.featured} />
      </section>

      {data.continueWatching?.length > 0 && (
        <section className="p-4">
          <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.continueWatching.map((m: HomeMovie) => (
              <div key={m.id} className="shrink-0 w-48">
                <MovieCard {...m} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {data.recentlyAdded.map((m: HomeMovie) => (
            <div key={"ra-" + m.id} className="shrink-0 w-48">
              <MovieCard {...m} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
