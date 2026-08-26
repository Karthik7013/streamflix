import { ShimmerImage } from "@/components/shimmer-image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Tag } from "@/types";

export function TagHero({ tag, movieCount }: { tag: Tag; movieCount?: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div className="relative aspect-[3/1] sm:aspect-[4/1]">
        {tag.imageUrl ? (
          <ShimmerImage
            src={tag.imageUrl}
            alt={tag.name}
            fill
            sizes="100vw"
            imgClassName="object-cover"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Explore
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading">{tag.name}</h1>
        {movieCount !== undefined && (
          <p className="mt-1 text-muted-foreground">
            {movieCount} {movieCount === 1 ? "movie" : "movies"}
          </p>
        )}
      </div>
    </div>
  );
}
