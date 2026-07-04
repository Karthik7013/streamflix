import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";

interface MovieCardProps {
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  progressSeconds?: number;
  durationSeconds?: number;
}

export const MovieCard = memo(function MovieCard({
  title,
  slug,
  thumbnailUrl,
  progressSeconds,
  durationSeconds,
}: MovieCardProps) {
  const progress =
    progressSeconds && durationSeconds
      ? (progressSeconds / durationSeconds) * 100
      : 0;

  return (
    <Link href={`/movies/${slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
        {thumbnailUrl && (
          <ShimmerImage
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            imgClassName="object-cover transition-transform group-hover:scale-105"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
        )}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
});
