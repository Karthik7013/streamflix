import type { Metadata } from "next";
import { getMovieBySlug } from "@/services/movies";
import { mediaMetadata } from "@/lib/metadata";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);

  if (!movie) {
    return {};
  }

  return mediaMetadata({
    title: movie.title,
    description: movie.description ?? undefined,
    url: `/movies/${movie.slug}`,
    image: movie.backdropUrl || movie.thumbnailUrl,
    type: "video.movie",
  });
}

export default async function MoviePage() {
  return <div>Movie Detail Page</div>;
}
