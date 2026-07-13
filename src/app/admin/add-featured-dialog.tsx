"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Search, Plus, Film, Loader2Icon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

const SearchResultRow = memo(function SearchResultRow({
  item,
  disabled,
  onAdd,
}: {
  item: SearchResult;
  disabled: boolean;
  onAdd: (id: number) => void;
}) {
  return (
    <button
      onClick={() => !disabled && onAdd(item.id)}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
    >
      {item.thumbnailUrl ? (
        <Image src={item.thumbnailUrl} alt={item.title} width={40} height={40} sizes="40px" className="size-10 rounded object-cover" />
      ) : (
        <div className="size-10 rounded bg-muted flex items-center justify-center">
          <Film className="size-4 text-muted-foreground" />
        </div>
      )}
      <span className="font-medium truncate flex-1">{item.title}</span>
      {disabled && <span className="text-xs text-muted-foreground">Already featured</span>}
    </button>
  );
});

export default function AddFeaturedDialog({
  open,
  onOpenChange,
  searchEndpoint,
  addEndpoint,
  entityIdField = "movieId",
  dialogTitle = "Add Featured",
  alreadyFeaturedIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchEndpoint: string;
  addEndpoint: string;
  entityIdField: "movieId" | "seriesId";
  dialogTitle: string;
  alreadyFeaturedIds: Set<number>;
  onSuccess?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const entityLabel = entityIdField === "movieId" ? "movie" : "series";
  const EntityLabel = entityIdField === "movieId" ? "Movie" : "Series";

  const { data: searchResults = [], isFetching: searching } = useQuery<SearchResult[]>({
    queryKey: [searchEndpoint, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const params = new URLSearchParams({ search: searchQuery.trim(), limit: "10" });
      const result = entityIdField === "movieId"
        ? await adminApi.movies.search(params)
        : await adminApi.series.search(params);
      return result.data;
    },
    enabled: !!searchQuery,
    staleTime: STALE.FAST,
  });

  const addMutation = useMutation({
    mutationFn: async (id: number) => {
      if (entityIdField === "movieId") {
        await adminApi.featured.create({ movieId: id });
      } else {
        await adminApi.featuredSeries.create({ seriesId: id });
      }
    },
    onSuccess: () => {
      setSearchQuery("");
      onOpenChange(false);
      onSuccess?.();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button><Plus className="size-4 mr-2" />Add {EntityLabel}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder={`Search ${entityLabel}s...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-5 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((item) => (
                <SearchResultRow key={item.id} item={item} disabled={alreadyFeaturedIds.has(item.id) || addMutation.isPending} onAdd={(id) => addMutation.mutate(id)} />
              ))
            ) : searchQuery ? (
              <p className="text-sm text-muted-foreground text-center py-4">No {entityLabel}s found.</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Type to search {entityLabel}s.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
