"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { searchApi } from "@/lib/api-client/search";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/use-debounce";

export function useSearchAutocomplete(q: string) {
  const debouncedQ = useDebounce(q);
  return useQuery({
    queryKey: queryKeys.search(debouncedQ),
    queryFn: async () => {
      const { data } = await searchApi.autocomplete(debouncedQ);
      return data;
    },
    enabled: debouncedQ.length >= 2,
    staleTime: STALE.FAST,
  });
}