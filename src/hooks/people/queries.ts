"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client/admin";
import { STALE } from "@/lib/stale-times";
import { queryKeys } from "@/lib/query-keys";
import type { Person } from "@/types";

export function usePeople() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.people,
    queryFn: async () => {
      const { data } = await adminApi.people.list(new URLSearchParams({ limit: "100" }));
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
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

export function useAdminPeople() {
  const { data, isLoading: loading, isError, refetch } = useQuery<Person[]>({
    queryKey: queryKeys.adminPeople(),
    queryFn: async () => {
      const { data } = await adminApi.people.list(new URLSearchParams({ limit: "100" }));
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
    gcTime: STALE.THIRTY_MIN,
  });

  const allPeople = useMemo(() => data ?? [], [data]);

  return { allPeople, loading, isError, retry: refetch };
}

export function useMovieCredits(movieId: number | null) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.movieCredits(movieId ?? 0),
    queryFn: async () => {
      const { data } = await adminApi.movieCredits.get(movieId);
      return data;
    },
    enabled: movieId !== null,
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const stableData = useMemo(() => data ?? { cast: [], crew: [] }, [data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
