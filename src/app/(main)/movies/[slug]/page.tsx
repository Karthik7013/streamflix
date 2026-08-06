import type { Metadata } from "next";
import { getMovieBySlug } from "@/services/movies";
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

  const description = (movie.description ?? "").slice(0, 160);

  return {
    title: movie.title,
    description,
    openGraph: {
      title: movie.title,
      description,
      type: "video.movie",
      images: [{ url: movie.thumbnailUrl, alt: movie.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: movie.title,
      description,
      images: [movie.thumbnailUrl],
    },
  };
}

export default function MoviePage() {
  return <MovieDetailClient />;
}
