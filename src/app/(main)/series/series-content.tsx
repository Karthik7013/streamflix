"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { TagFilter } from "@/components/tag-filter";
import { SeriesGrid } from "@/app/(main)/series/series-grid";
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
import { useSeriesSearch } from "@/hooks/use-series-search";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt", dir: "asc" as const },
  { label: "Oldest", value: "createdAt", dir: "desc" as const },
  { label: "Title A-Z", value: "title", dir: "asc" as const },
  { label: "Title Z-A", value: "title", dir: "desc" as const },
  { label: "Year ↓", value: "releaseDate", dir: "desc" as const },
  { label: "Year ↑", value: "releaseDate", dir: "asc" as const },
];

export function SeriesContent() {
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
  const series = useSeriesSearch(debouncedQ, selectedTags, sortBy, sortDir);

  const toggleTag = useCallback((tagId: number) => {
    if (tagId === -1) {
      setSelectedTags([]);
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy && o.dir === sortDir)?.label ??
    "Newest";

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 space-y-4 -mx-4 px-4">
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

      <SeriesGrid {...series} />
    </div>
  );
}
