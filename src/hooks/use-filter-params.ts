"use client";

import { useState, useEffect, useCallback } from "react";
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

  const [params, setParamsState] = useState<FilterParams>(() => readParams(searchParams));
  const [paramsKey, setParamsKey] = useState(() => searchParams.toString());

  const key = searchParams.toString();
  if (key !== paramsKey) {
    setParamsKey(key);
    setParamsState(readParams(searchParams));
  }

  const setQ = useCallback((q: string) => setParamsState((prev) => ({ ...prev, q })), []);
  const toggleTag = useCallback((tagId: number) => {
    setParamsState((prev) =>
      tagId === -1
        ? { ...prev, tags: [] }
        : {
            ...prev,
            tags: prev.tags.includes(tagId)
              ? prev.tags.filter((t) => t !== tagId)
              : [...prev.tags, tagId],
          }
    );
  }, []);
  const setSortBy = useCallback((sortBy: string) => {
    setParamsState((prev) => ({ ...prev, sortBy }));
  }, []);
  const setSortDir = useCallback((sortDir: "asc" | "desc") => {
    setParamsState((prev) => ({ ...prev, sortDir }));
  }, []);

  const debouncedQ = useDebounce(params.q, 300);

  useEffect(() => {
    setParams({
      q: params.q || undefined,
      tags: params.tags.length ? params.tags.join(",") : undefined,
      sort: params.sortBy,
      dir: params.sortDir,
    });
  }, [params, setParams]);

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