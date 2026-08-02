"use client";

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
import { useFilterParams } from "@/hooks/use-filter-params";
import { useTags } from "@/hooks/use-tags";
import { useMovieSearch } from "@/hooks/use-movie-search";

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

export function ExploreContent() {
  const { q, setQ, debouncedQ, selectedTags, toggleTag, sortBy, setSortBy, sortDir, setSortDir } =
    useFilterParams();

  const tags = useTags();
  const movies = useMovieSearch(debouncedQ, selectedTags, sortBy, sortDir);

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
