import type { Metadata } from "next";
import { getMovieBySlug } from "@/services/movies";
import { mediaMetadata } from "@/lib/metadata";
import { MovieDetailClient } from "@/app/(main)/movies/[slug]/movie-detail-client";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
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

export default function MoviePage() {
  return <MovieDetailClient />;
}
