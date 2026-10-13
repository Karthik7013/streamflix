import { WatchContent } from "@/app/(main)/watch/[slug]/watch-content";
import type { Metadata } from "next";
import { getMovieBySlug } from "@/services/movies";
import { mediaMetadata } from "@/lib/metadata";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);

  if (!movie) {
    return { title: "Now Watching" };
  }

  return mediaMetadata({
    title: movie.title,
    description: movie.description ?? undefined,
    url: `/watch/${movie.slug}`,
    image: movie.backdropUrl || movie.thumbnailUrl,
    type: "video.movie",
  });
}

export default function WatchPage() {
  return (
    <WatchContent />
  );
}
