"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { moviesApi } from "@/lib/api/movies";
import { queryKeys } from "@/lib/query-keys";

export function useMovieDetail(slug: string) {
  const result = useQuery({
    queryKey: queryKeys.movie(slug),
    queryFn: async () => {
      const { data } = await moviesApi.getBySlug(slug);
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  return {
    movie: result.data,
    loading: result.isLoading,
    isError: result.isError,
    error: result.error,
    retry: result.refetch,
  };
}
