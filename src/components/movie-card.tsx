"use client";

import Link from "next/link";
import Image from "next/image";

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
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
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
    </Link>
  );
}
