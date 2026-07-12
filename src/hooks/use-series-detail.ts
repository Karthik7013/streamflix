import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { seriesApi } from "@/lib/api/series";
import { ApiError } from "@/lib/api/client";
import { notFound } from "next/navigation";

export interface SeriesDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null;
  tags: { id: number; name: string }[];
  seasons: {
    id: number;
    seasonNumber: number;
    title: string | null;
    episodes: {
      id: number;
      episodeNumber: number;
      title: string;
      description: string | null;
      thumbnailUrl: string | null;
      videoUrl: string | null;
      durationSeconds: number | null;
    }[];
  }[];
}

export function useSeriesDetail(slug: string) {
  const result = useQuery<SeriesDetail>({
    queryKey: ["series", slug],
    queryFn: async () => {
      try {
        const data = await seriesApi.getBySlug(slug);
        return data as SeriesDetail;
      } catch (err) {
        if (err instanceof ApiError && err.code === "not-found") {
          notFound();
        }
        throw err;
      }
    },
    staleTime: STALE.DEFAULT,
  });

  return {
    data: result.data,
    loading: result.isLoading,
    isError: result.isError,
    retry: result.refetch,
  };
}
