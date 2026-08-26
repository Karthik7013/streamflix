"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { SearchCommandDialog } from "@/app/(main)/explore/search-command-dialog";
import { TagCard } from "@/app/(main)/explore/tag-card";
import { useTags } from "@/hooks/use-tags";
import { skeletonItems } from "@/lib/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS = skeletonItems(10);

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tags.loading
          ? SKELETON_ITEMS.map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : tags.data.map((tag) => <TagCard key={tag.id} tag={tag} />)}
      </div>
    </div>
  );
}
