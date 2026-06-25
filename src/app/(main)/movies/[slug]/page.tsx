import { MovieDetailClient } from "./movie-detail-client";

export default function MoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <MovieDetailClient />;
}
