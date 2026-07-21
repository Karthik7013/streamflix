"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { useTags } from "@/hooks/use-tags";
import { useSeriesSearch } from "@/hooks/use-series-search";
import { SeriesGrid } from "@/app/(main)/series/series-grid";
import { TagFilter } from "@/components/tag-filter";

export function SeriesContent() {
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);

  const tags = useTags();
  const tagParam = selectedTags.length > 0 ? selectedTags.join(",") : undefined;
  const series = useSeriesSearch(debouncedQ, tagParam);

  const toggleTag = useCallback((tagId: number) => {
    if (tagId === -1) {
      setSelectedTags([]);
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4 -mx-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Series</h1>
        </div>
        <SearchBar value={q} onChange={setQ} />
      </div>

      <TagFilter
        data={tags.data}
        loading={tags.loading}
        selectedTags={selectedTags}
        onToggle={toggleTag}
      />

      <SeriesGrid {...series} />
    </div>
  );
}
