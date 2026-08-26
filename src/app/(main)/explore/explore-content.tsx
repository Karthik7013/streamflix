"use client";

import { useState } from "react";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { SearchDropdown } from "@/app/(main)/explore/search-dropdown";
import { TagCard } from "@/app/(main)/explore/tag-card";
import { useTags } from "@/hooks/use-tags";
import { useDebounce } from "@/hooks/use-debounce";
import { skeletonItems } from "@/lib/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS = skeletonItems(10);

export function ExploreContent() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const tags = useTags();

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
        <div className="relative">
          <SearchBar value={q} onChange={setQ} />
          {debouncedQ.length >= 2 && (
            <SearchDropdown query={debouncedQ} onClose={() => setQ("")} />
          )}
        </div>
      </div>

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
