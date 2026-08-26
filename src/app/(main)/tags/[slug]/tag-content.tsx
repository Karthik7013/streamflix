"use client";

import { TagHero } from "./tag-hero";
import { TagMovieGrid } from "./tag-movie-grid";
import { useTagMovies } from "@/hooks/use-tag-movies";
import { api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import type { Tag } from "@/types";

export function TagContent({ slug }: { slug: string }) {
  const movies = useTagMovies(slug);

  const { data: tag } = useQuery({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const { data } = await api<{ data: Tag }>(`/api/tags/${slug}`);
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
  });

  if (!tag) {
    return (
      <div className="space-y-6">
        <div className="aspect-[3/1] sm:aspect-[4/1] rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TagHero tag={tag} movieCount={movies.data.length} />
      <TagMovieGrid {...movies} />
    </div>
  );
}
