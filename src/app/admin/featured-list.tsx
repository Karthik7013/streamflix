"use client";

import { memo } from "react";
import Image from "next/image";
import { Film, ArrowUp, ArrowDown, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedItem {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  [key: string]: unknown;
}

const FeaturedRow = memo(function FeaturedRow({
  item,
  index,
  total,
  onSwap,
  onRemove,
}: {
  item: FeaturedItem;
  index: number;
  total: number;
  onSwap: (index: number, direction: "up" | "down") => void;
  onRemove: (id: number) => void;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          {item.thumbnailUrl ? (
            <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
              <Image src={item.thumbnailUrl} alt={item.title} width={40} height={40} className="size-full object-cover" />
            </div>
          ) : (
            <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Film className="size-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{item.title}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">#{item.displayOrder + 1}</td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => onSwap(index, "up")} disabled={index === 0}>
            <ArrowUp className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onSwap(index, "down")} disabled={index === total - 1}>
            <ArrowDown className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onRemove(item.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

export default function FeaturedList({
  featured,
  isLoading,
  onSwap,
  onRemove,
  entityIdField = "movieId",
}: {
  featured: FeaturedItem[];
  isLoading: boolean;
  onSwap: (index: number, direction: "up" | "down") => void;
  onRemove: (id: number) => void;
  entityIdField?: "movieId" | "seriesId";
}) {
  const entityLabel = entityIdField === "movieId" ? "Movie" : "Series";
  const entityLabelLower = entityIdField === "movieId" ? "movie" : "series";

  if (isLoading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-10 rounded-md shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12 shrink-0" />
            <div className="flex gap-1 shrink-0">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (featured.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Star className="size-10 mx-auto mb-3 opacity-30" />
        <p>No featured {entityLabelLower}s yet.</p>
        <p className="text-sm mt-1">Click &ldquo;Add {entityLabel}&rdquo; to feature {entityLabelLower}s on the home page.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
            <th className="px-4 py-3 font-medium w-[50%]">{entityLabel}</th>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {featured.map((item, index) => (
            <FeaturedRow key={item.id} item={item} index={index} total={featured.length} onSwap={onSwap} onRemove={onRemove} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
