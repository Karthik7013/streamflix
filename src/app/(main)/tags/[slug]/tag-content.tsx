"use client";

import { TagHero } from "./tag-hero";
import { TagMovieGrid } from "./tag-movie-grid";
import { useTagMovies } from "@/hooks/tags";
import { api } from "@/lib/api-client/client";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import type { Tag } from "@/types";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { PosterGridSkeleton } from "@/components/movie/poster-grid-skeleton";

export function TagContent({ slug }: { slug: string }) {
  const movies = useTagMovies(slug);

  const { data: tag } = useQuery({
    queryKey: queryKeys.tag(slug),
    queryFn: async () => {
      const { data } = await api<{ data: Tag }>(`/api/tags/${slug}`);
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
  });

  const waiting = !tag || (movies.loading && movies.data.length === 0);

  if (waiting) {
    return (
      <div className="space-y-6">
        <Skeleton className="aspect-[3/1] sm:aspect-[4/1] rounded-2xl" />
        <div className="p-8">
          <PosterGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TagHero tag={tag} movieCount={movies.data.length} />
      <div className="p-8">
        <TagMovieGrid {...movies} />
      </div>
    </div>
  );
}