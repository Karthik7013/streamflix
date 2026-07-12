import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { homeApi, HomeFeaturedItem } from "@/lib/api/home";

export function useFeatured() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-featured"],
    queryFn: () => homeApi.featured(),
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const stableData = useMemo(() => (data?.featured ?? []) as HomeFeaturedItem[], [data?.featured]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
