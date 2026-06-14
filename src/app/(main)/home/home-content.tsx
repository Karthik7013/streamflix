"use client";

import { useQuery } from "@tanstack/react-query";
import { HeroCarousel } from "@/components/hero-carousel";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchHome() {
  const res = await fetch("/api/home");
  if (!res.ok) throw new Error("Failed to fetch home data");
  return res.json();
}

export function HomeContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
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
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <section>
        <HeroCarousel items={data.featured} />
      </section>

      {data.continueWatching?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.continueWatching.map((m: any) => (
              <div key={m.id} className="shrink-0 w-48">
                <MovieCard {...m} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {data.recentlyAdded.map((m: any) => (
            <div key={"ra-" + m.id} className="shrink-0 w-48">
              <MovieCard {...m} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
