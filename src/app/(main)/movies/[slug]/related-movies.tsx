"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";

interface RelatedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

interface RelatedData {
  related: RelatedMovie[];
}

export default function RelatedMovies() {
  const params = useParams<{ slug: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["related-movies", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${params.slug}/related`);
      if (!res.ok) throw new Error("fetch-failed");
      return res.json() as Promise<RelatedData>;
    },
    refetchOnMount: false,
  });

  const movies = data?.related || [];

  if (isLoading) {
    return (
      <section className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Related Movies</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-48 space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Related Movies</h2>
        <ErrorState message="Failed to load related movies." onRetry={refetch} />
      </section>
    );
  }

  if (movies.length === 0) return null;

  return (
    <section className="pt-4">
      <h2 className="text-xl font-semibold mb-4">Related Movies</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {movies.map((m) => (
          <div key={m.id} className="shrink-0 w-48">
            <MovieCard {...m} />
          </div>
        ))}
      </div>
    </section>
  );
}
