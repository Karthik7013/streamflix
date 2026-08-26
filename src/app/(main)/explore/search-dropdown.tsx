"use client";

import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchAutocomplete } from "@/hooks/use-search-autocomplete";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS = skeletonItems(5);

export const SearchDropdown = memo(function SearchDropdown({
  query,
  onClose,
}: {
  query: string;
  onClose: () => void;
}) {
  const { data: results, isLoading } = useSearchAutocomplete(query);
  const items = results ?? [];

  if (query.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/50 bg-background shadow-lg overflow-hidden">
      {isLoading ? (
        <div className="p-2 space-y-1">
          {SKELETON_ITEMS.map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-10 rounded-md shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No results found.
        </div>
      ) : (
        <div className="p-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/movies/${item.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                <ShimmerImage
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="40px"
                  imgClassName="object-cover"
                  wrapperClassName="absolute inset-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-sm font-medium truncate">{item.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
