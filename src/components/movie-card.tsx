"use client";

import Link from "next/link";

interface MovieCardProps {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  progressSeconds?: number;
  durationSeconds?: number;
}

export function MovieCard({
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
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={thumbnailUrl}
          alt={title}
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium truncate">{title}</h3>
    </Link>
  );
}
