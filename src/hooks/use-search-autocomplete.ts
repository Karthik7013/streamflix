"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { searchApi } from "@/lib/api/search";
import type { SearchResult } from "@/services/search";

export function useSearchAutocomplete(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      const { data } = await searchApi.autocomplete(q);
      return data;
    },
    enabled: q.length >= 2,
    staleTime: STALE.FAST,
  });
}
