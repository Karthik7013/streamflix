"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { SearchCommandDialog } from "@/app/(main)/explore/search-command-dialog";
import { TagCard } from "@/app/(main)/explore/tag-card";
import { useTags } from "@/hooks/tags";
import { PosterGridSkeleton } from "@/components/movie/poster-grid-skeleton";

export function ExploreContent() {
  const [searchOpen, setSearchOpen] = useState(false);
  const tags = useTags();

  const handleOpen = useCallback(() => setSearchOpen(true), []);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
        <SearchBar onClick={handleOpen} />
      </div>

      <SearchCommandDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {tags.loading ? (
        <PosterGridSkeleton
          count={10}
          gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          cardClassName="aspect-video rounded-xl"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tags.data.map((tag) => <TagCard key={tag.id} tag={tag} />)}
        </div>
      )}
    </div>
  );
}
