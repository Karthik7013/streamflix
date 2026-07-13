"use client";

import { useState } from "react";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { useTags } from "@/hooks/use-tags";
import { useSeriesSearch } from "@/hooks/use-series-search";
import { SeriesGrid } from "@/app/(main)/series/series-grid";

export function SeriesContent() {
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);

  const tags = useTags();
  const tagParam = selectedTags.length > 0 ? selectedTags.join(",") : undefined;
  const series = useSeriesSearch(debouncedQ, tagParam);

  function toggleTag(tagId: number) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4 -mx-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Series</h1>
        </div>
        <SearchBar value={q} onChange={setQ} />
      </div>

      {tags.data.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedTags([])}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTags.length === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {tags.data.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <SeriesGrid {...series} />
    </div>
  );
}
