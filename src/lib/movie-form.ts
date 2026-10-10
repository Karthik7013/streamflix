import type { Movie } from "@/types";
import type { MovieFormData } from "@/lib/schemas";

export function toMovieFormData(movie: Movie): Partial<MovieFormData> {
  return {
    title: movie.title,
    slug: movie.slug,
    description: movie.description ?? "",
    videoUrl: movie.videoUrl ?? "",
    thumbnailUrl: movie.thumbnailUrl ?? "",
    backdropUrl: movie.backdropUrl ?? "",
    trailerUrl: movie.trailerUrl ?? "",
    durationSeconds: movie.durationSeconds ? String(movie.durationSeconds) : "",
    releaseDate: movie.releaseDate ?? "",
    originalLanguage: movie.originalLanguage ?? "",
    tagIds: movie.tags.map((t) => t.id),
    tmdbId: movie.tmdbId ?? undefined,
    published: movie.published ?? false,
  };
}
