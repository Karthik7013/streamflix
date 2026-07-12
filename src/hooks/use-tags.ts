import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { STALE } from "@/lib/stale-times";
import { tagsApi } from "@/lib/api/tags";

export function useTags() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list(),
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const stableData = useMemo(() => data ?? [], [data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
