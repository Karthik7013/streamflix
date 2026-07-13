import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { moviesApi } from "@/lib/api/movies";

export function useMovieDetail(slug: string) {
  const result = useQuery({
    queryKey: ["movie", slug],
    queryFn: async () => {
      const { data } = await moviesApi.getBySlug(slug);
      return data;
    },
    staleTime: STALE.DEFAULT,
  });

  return {
    movie: result.data,
    loading: result.isLoading,
    error: result.error,
    retry: result.refetch,
  };
}
