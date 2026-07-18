import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { seriesApi } from "@/lib/api/series";
import type { Season } from "@/types";

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
  seasons: Season[];
}

export function useSeriesDetail(slug: string) {
  const result = useQuery<SeriesDetail>({
    queryKey: ["series", slug],
    queryFn: async () => {
      const { data } = await seriesApi.getBySlug(slug);
      return data as SeriesDetail;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error,
    retry: result.refetch,
  };
}
