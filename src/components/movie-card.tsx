import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";

interface MovieCardProps {
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

export const MovieCard = memo(function MovieCard({ title, slug, thumbnailUrl }: MovieCardProps) {
  return (
    <Link href={`/movies/${slug}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
        <ShimmerImage
          src={thumbnailUrl ?? ""}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          imgClassName="object-cover transition-transform group-hover:scale-105"
          wrapperClassName="absolute inset-0"
          referrerPolicy="no-referrer"
        />
      </div>
      <p className="mt-1.5 text-sm font-medium truncate">{title}</p>
    </Link>
  );
});
