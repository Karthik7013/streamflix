"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { STALE } from "@/lib/stale-times";
import { apiFetch } from "@/lib/api/client";
import { type SortingState } from "@tanstack/react-table";

interface UseAdminCrudOptions {
  baseKey: string;
  endpoint: string;
  defaultLimit?: number;
}

export function useAdminCrud<T>({ baseKey, endpoint, defaultLimit = 20 }: UseAdminCrudOptions) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const debouncedSearch = useDebounce(search, 300);
  const limit = defaultLimit;

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const queryKey = [baseKey, page, debouncedSearch, sortBy, sortDir];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      const res = await apiFetch(`${endpoint}?${params}`, { cache: "no-cache" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ total: number; totalPages: number } & Record<string, T[]>>;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const items: T[] = (data?.items ?? []) as T[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Deleted successfully.");
      queryClient.invalidateQueries({ queryKey: [baseKey] });
    },
    onError: () => toast.error("Unable to delete."),
  });

  function invalidateList() {
    queryClient.invalidateQueries({ queryKey: [baseKey] });
  }

  return {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sorting,
    setSorting,
    limit,
    items,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
    deleteMutation,
    invalidateList,
  };
}
