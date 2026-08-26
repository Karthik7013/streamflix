"use client";

import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";
import type { Tag } from "@/types";

export const TagCard = memo(function TagCard({ tag }: { tag: Tag }) {
  return (
    <Link href={`/tags/${tag.slug}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        {tag.imageUrl ? (
          <ShimmerImage
            src={tag.imageUrl}
            alt={tag.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            imgClassName="object-cover transition-transform group-hover:scale-105"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-2xl font-bold text-muted-foreground/40">{tag.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm font-medium truncate">{tag.name}</p>
    </Link>
  );
});
