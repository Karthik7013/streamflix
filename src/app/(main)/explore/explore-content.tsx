"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import SearchBar from "./search-bar";
import TagFilter from "./tag-filter";
import MovieGrid from "./movie-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlParams } from "@/hooks/use-url-params";
import { STALE } from "@/lib/stale-times";
import { tagsApi } from "@/lib/api/tags";
import { moviesApi } from "@/lib/api/movies";
import type { MovieCardData } from "@/types";

const SCROLL_KEY = "explore-scroll";

function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    const style = getComputedStyle(el);
    if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

function getMainElement(): HTMLElement | null {
  return document.querySelector("main");
}

function useScrollRestoration() {
  const scrollRef = useRef<number>(0);
  const restoringRef = useRef(false);

  useEffect(() => {
    const el = findScrollContainer(getMainElement());
    if (!el) return;

    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      restoringRef.current = true;
      el.scrollTop = parseInt(saved, 10);
      restoringRef.current = false;
      sessionStorage.removeItem(SCROLL_KEY);
    }

    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!restoringRef.current) {
          scrollRef.current = el.scrollTop;
        }
      }, 300);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current));
    };
  }, []);
}

export function ExploreContent() {
  const searchParams = useSearchParams();
  const { setParams } = useUrlParams();
  const syncingRef = useRef(false);

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const debouncedQ = useDebounce(q, 300);
  const [selectedTags, setSelectedTags] = useState<number[]>(
    () => searchParams.get("tags")?.split(",").map(Number) ?? []
  );
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") ?? "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    () => (searchParams.get("dir") as "asc" | "desc") ?? "desc"
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  useScrollRestoration();

  useEffect(() => {
    syncingRef.current = true;
    setQ(searchParams.get("q") ?? "");
    setSelectedTags(searchParams.get("tags")?.split(",").map(Number) ?? []);
    setSortBy(searchParams.get("sort") ?? "createdAt");
    setSortDir((searchParams.get("dir") as "asc" | "desc") ?? "desc");
    queueMicrotask(() => { syncingRef.current = false });
  }, [searchParams]);

  useEffect(() => {
    if (syncingRef.current) return;
    setParams({ q: q || undefined, tags: selectedTags.length ? selectedTags.join(",") : undefined, sort: sortBy, dir: sortDir } as Record<string, string | undefined>);
  }, [q, selectedTags, sortBy, sortDir]);

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list(),
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["movies", debouncedQ, selectedTags, sortBy, sortDir],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams();
      if (debouncedQ) p.set("q", debouncedQ);
      if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
      p.set("page", String(pageParam));
      p.set("sortBy", sortBy);
      p.set("sortDir", sortDir);
      return moviesApi.list(p);
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, p) => sum + p.movies.length, 0);
      return totalFetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const movies = (data?.pages.flatMap((p) => p.movies) ?? []) as MovieCardData[];
  const loading = isLoading || isFetchingNextPage;

  useEffect(() => {
    const scrollContainer = findScrollContainer(
      document.querySelector("main")
    );
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollContainer, rootMargin: "0px 0px 1000px 0px", threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleTag = useCallback((tagId: number) => {
    if (tagId === -1) {
      setSelectedTags([]);
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const sortOptions: { label: string; value: string; dir: "asc" | "desc" }[] = [
    { label: "Newest", value: "createdAt", dir: "desc" },
    { label: "Oldest", value: "createdAt", dir: "asc" },
    { label: "Title A-Z", value: "title", dir: "asc" },
    { label: "Title Z-A", value: "title", dir: "desc" },
    { label: "Shortest", value: "durationSeconds", dir: "asc" },
    { label: "Longest", value: "durationSeconds", dir: "desc" },
    { label: "Year ↓", value: "releaseDate", dir: "desc" },
    { label: "Year ↑", value: "releaseDate", dir: "asc" },
  ];

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy && o.dir === sortDir)?.label ??
    "Newest";

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4 space-y-4 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar value={q} onChange={setQ} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors outline-none">
              <ArrowUpDown className="size-3.5" />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={`${opt.value}-${opt.dir}`}
                  onClick={() => {
                    setSortBy(opt.value);
                    setSortDir(opt.dir);
                  }}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <TagFilter
          tags={tags?.items ?? []}
          selectedTags={selectedTags}
          onToggle={toggleTag}
          isLoading={tagsLoading}
        />
      </div>

      <MovieGrid
        movies={movies}
        isLoading={loading}
        isError={isError}
        ref={sentinelRef}
      />

    </div>
  );
}
