"use client";

import { cn } from "@/lib/utils";
import { useAdminTags } from "@/hooks/use-admin-tags";

const SKELETON_ITEMS_5 = Array.from({ length: 5 }, (_, i) => i);

interface TagSelectorProps {
  selectedIds: number[];
  onToggle: (tagId: number) => void;
}

export function TagSelector({ selectedIds, onToggle }: TagSelectorProps) {
  const { allTags, loading, isError } = useAdminTags();

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Tags</label>
      {loading ? (
        <div className="flex flex-wrap gap-2">
          {SKELETON_ITEMS_5.map((i) => (
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
