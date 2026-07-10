"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/admin";
import type { Tag } from "@/types";

interface TagSelectorProps {
  selectedIds: number[];
  onToggle: (tagId: number) => void;
}

export function TagSelector({ selectedIds, onToggle }: TagSelectorProps) {
  const { data: allTags, isLoading, isError } = useQuery<Tag[]>({
    queryKey: ["admin-tags-select"],
    queryFn: async () => {
      const res = await adminApi.tags.list(new URLSearchParams({ limit: "100" }));
      return res.items ?? [];
    },
  });

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Tags</label>
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-16 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Unable to load tags.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allTags?.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors",
                selectedIds.includes(tag.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {tag.name}
            </button>
          ))}
          {allTags?.length === 0 && (
            <span className="text-sm text-muted-foreground">No tags available.</span>
          )}
        </div>
      )}
    </div>
  );
}
