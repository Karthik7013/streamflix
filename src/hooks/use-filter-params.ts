"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlParams } from "@/hooks/use-url-params";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

interface FilterParams {
  q: string;
  tags: number[];
  sortBy: string;
  sortDir: "asc" | "desc";
}

function readParams(searchParams: URLSearchParams): FilterParams {
  return {
    q: searchParams.get("q") ?? "",
    tags: searchParams.get("tags")?.split(",").map(Number) ?? [],
    sortBy: searchParams.get("sort") ?? "createdAt",
    sortDir: (searchParams.get("dir") as "asc" | "desc") ?? "desc",
  };
}

export function useFilterParams() {
  const searchParams = useSearchParams();
  const { setParams } = useUrlParams();

  const params = useMemo(() => readParams(searchParams), [searchParams]);

  const setQ = useCallback((q: string) => setParams({ q: q || undefined }), [setParams]);

  const toggleTag = useCallback(
    (tagId: number) => {
      const tags =
        tagId === -1
          ? []
          : params.tags.includes(tagId)
            ? params.tags.filter((t) => t !== tagId)
            : [...params.tags, tagId];
      setParams({ tags: tags.length ? tags.join(",") : undefined });
    },
    [params.tags, setParams],
  );

  const setSortBy = useCallback((sortBy: string) => setParams({ sort: sortBy }), [setParams]);

  const setSortDir = useCallback(
    (sortDir: "asc" | "desc") => setParams({ dir: sortDir }),
    [setParams],
  );

  const debouncedQ = useDebounce(params.q, 300);

  useScrollRestoration();

  return {
    q: params.q,
    setQ,
    debouncedQ,
    selectedTags: params.tags,
    toggleTag,
    sortBy: params.sortBy,
    setSortBy,
    sortDir: params.sortDir,
    setSortDir,
  };
}
