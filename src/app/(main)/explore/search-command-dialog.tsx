"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ShimmerImage } from "@/components/shimmer-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchAutocomplete } from "@/hooks/use-search-autocomplete";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS = skeletonItems(5);

export function SearchCommandDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSearchAutocomplete(query);
  const items = results ?? [];

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search movies..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && query.length >= 2 ? (
          <div className="p-2 space-y-1">
            {SKELETON_ITEMS.map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="size-10 rounded-md shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => onOpenChange(false)}
                  className="gap-3 p-2 cursor-pointer"
                >
                  <Link
                    href={`/movies/${item.slug}`}
                    className="flex items-center gap-3 flex-1"
                    onClick={() => onOpenChange(false)}
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
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
