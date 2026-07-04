import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";

interface SeriesCardProps {
  title: string;
  slug: string;
  thumbnailUrl: string;
  seasonCount?: number;
}

export const SeriesCard = memo(function SeriesCard({ title, slug, thumbnailUrl, seasonCount }: SeriesCardProps) {
  return (
    <Link href={`/series/${slug}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
        <ShimmerImage
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          imgClassName="object-cover transition-transform group-hover:scale-105"
          wrapperClassName="absolute inset-0"
          referrerPolicy="no-referrer"
        />
        {seasonCount !== undefined && (
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium">
            {seasonCount} {seasonCount === 1 ? "season" : "seasons"}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-sm font-medium truncate">{title}</p>
    </Link>
  );
});
