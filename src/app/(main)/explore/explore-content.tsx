"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { TagFilter } from "@/components/tag-filter";
import { MovieGrid } from "@/app/(main)/explore/movie-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlParams } from "@/hooks/use-url-params";
import { useTags } from "@/hooks/use-tags";
import { useMovieSearch } from "@/hooks/use-movie-search";

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

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt", dir: "asc" as const },
  { label: "Oldest", value: "createdAt", dir: "desc" as const },
  { label: "Title A-Z", value: "title", dir: "asc" as const },
  { label: "Title Z-A", value: "title", dir: "desc" as const },
  { label: "Shortest", value: "durationSeconds", dir: "asc" as const },
  { label: "Longest", value: "durationSeconds", dir: "desc" as const },
  { label: "Year ↓", value: "releaseDate", dir: "desc" as const },
  { label: "Year ↑", value: "releaseDate", dir: "asc" as const },
];

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

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const debouncedQ = useDebounce(q, 300);
  const [selectedTags, setSelectedTags] = useState<number[]>(
    () => searchParams.get("tags")?.split(",").map(Number) ?? []
  );
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") ?? "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    () => (searchParams.get("dir") as "asc" | "desc") ?? "desc"
  );
  const isSyncingRef = useRef(false);

  useScrollRestoration();

  useEffect(() => {
    isSyncingRef.current = true;
    setQ(searchParams.get("q") ?? "");
    setSelectedTags(searchParams.get("tags")?.split(",").map(Number) ?? []);
    setSortBy(searchParams.get("sort") ?? "createdAt");
    setSortDir((searchParams.get("dir") as "asc" | "desc") ?? "desc");
  }, [searchParams]);

  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    setParams({ q: q || undefined, tags: selectedTags.length ? selectedTags.join(",") : undefined, sort: sortBy, dir: sortDir } as Record<string, string | undefined>);
  }, [q, selectedTags, sortBy, sortDir, setParams]);

  const tags = useTags();
  const movies = useMovieSearch(debouncedQ, selectedTags, sortBy, sortDir);

  const toggleTag = useCallback((tagId: number) => {
    if (tagId === -1) {
      setSelectedTags([]);
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy && o.dir === sortDir)?.label ??
    "Newest";

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 space-y-4 -mx-4 px-4 ">
        <div className="flex items-center gap-3">
          <div className="flex-1 ">
            <SearchBar value={q} onChange={setQ} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors outline-none">
              <ArrowUpDown className="size-3.5" />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {SORT_OPTIONS.map((opt) => (
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
          data={tags.data}
          loading={tags.loading}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
      </div>

      <MovieGrid {...movies} />
    </div>
  );
}
