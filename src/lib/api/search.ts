import { api } from "@/lib/api/client";
import type { SearchResult } from "@/services/search";

export const searchApi = {
  autocomplete: (q: string) =>
    api<{ data: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`),
};
