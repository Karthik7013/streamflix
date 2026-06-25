"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { authClient } from "@/lib/auth-client";
import SearchBar from "./search-bar";
import TagFilter from "./tag-filter";
import MovieGrid from "./movie-grid";

const SCROLL_KEY = "explore-scroll";

function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    const style = getComputedStyle(el);
    if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

function useScrollRestoration() {
  const scrollRef = useRef<number>(0);
  const restoringRef = useRef(false);

  useEffect(() => {
    const el = findScrollContainer(document.querySelector("main"));
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

async function fetchTags() {
  const res = await fetch("/api/tags");
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

async function fetchMovies(params: string) {
  const res = await fetch(`/api/movies?${params}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  return res.json();
}

export function ExploreContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";
  useScrollRestoration();

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
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
    queryKey: ["movies", debouncedSearch, selectedTags],
    queryFn: ({ pageParam }) => {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set("q", debouncedSearch);
      if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
      if (pageParam) p.set("cursor", String(pageParam));
      return fetchMovies(p.toString());
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const movies = data?.pages.flatMap((p) => p.movies) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const loading = isLoading || isFetchingNextPage;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleTag = useCallback((tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  return (
    <div className="space-y-6">
      <SearchBar value={search} onChange={setSearch} />

      <TagFilter
        tags={tags ?? []}
        selectedTags={selectedTags}
        onToggle={toggleTag}
        isLoading={tagsLoading}
      />

      <MovieGrid
        movies={movies}
        total={total}
        isLoading={loading}
        isError={isError}
        isAdmin={isAdmin}
        ref={sentinelRef}
      />
    </div>
  );
}
