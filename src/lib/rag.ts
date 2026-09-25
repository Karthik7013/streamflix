import { logger } from "@/lib/logger";
import { db } from "@/db";
import { movies, movieTags, tags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { groupBy } from "@/lib/db-utils";
import { vectorIndex } from "@/lib/vector";
import { nvidiaEmbed } from "@/lib/nvidia";

export interface MovieIndexPayload {
  movieId: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  overview: string | null;
  language: string | null;
  tags: string[];
}

export interface RagMovieResult {
  title: string;
  slug: string;
  thumbnailUrl: string;
  description: string;
}

function buildMovieSearchText(m: MovieIndexPayload): string {
  const parts = [`Title: ${m.title}`];
  if (m.tags.length > 0) parts.push(`Genres: ${m.tags.join(", ")}`);
  if (m.overview) parts.push(`Overview: ${m.overview}`);
  if (m.language) parts.push(`Language: ${m.language}`);
  return parts.join(". ");
}

export async function indexMovie(movie: MovieIndexPayload): Promise<void> {
  await indexMovies([movie]);
}

export async function indexMovies(payloads: MovieIndexPayload[]): Promise<void> {
  const items = payloads
    .map((movie) => ({ movie, content: buildMovieSearchText(movie) }))
    .filter((item) => item.content !== `Title: ${item.movie.title}`);

  const BATCH = 16;
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    const vectors = await nvidiaEmbed(slice.map((s) => s.content), "passage");
    await vectorIndex.upsert(
      slice.map((s, k) => ({
        id: `movie-${s.movie.movieId}`,
        vector: vectors[k],
        metadata: {
          content: s.content,
          source: s.movie.title,
          type: "movie" as const,
          movieId: s.movie.movieId,
          slug: s.movie.slug,
          thumbnailUrl: s.movie.thumbnailUrl,
          overview: s.movie.overview ?? undefined,
        },
      }))
    );
  }
}

export async function deleteMovieVector(movieId: number): Promise<void> {
  try {
    await vectorIndex.delete([`movie-${movieId}`]);
  } catch (err) {
    logger.error("rag", "Failed to delete movie vector", err);
  }
}

export async function indexMovieById(movieId: number): Promise<void> {
  const [movieRow] = await db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      description: movies.description,
      originalLanguage: movies.originalLanguage,
    })
    .from(movies)
    .where(eq(movies.id, movieId))
    .limit(1);
  if (!movieRow) return;

  const tagRows = await db
    .select({ name: tags.name })
    .from(movieTags)
    .innerJoin(tags, eq(movieTags.tagId, tags.id))
    .where(eq(movieTags.movieId, movieId));

  await indexMovie({
    movieId: movieRow.id,
    title: movieRow.title,
    slug: movieRow.slug,
    thumbnailUrl: movieRow.thumbnailUrl,
    overview: movieRow.description,
    language: movieRow.originalLanguage,
    tags: tagRows.map((t) => t.name),
  });
}

export async function getAllPublishedMoviesForIndex(): Promise<MovieIndexPayload[]> {
  const [movieRows, tagRows] = await Promise.all([
    db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
        description: movies.description,
        originalLanguage: movies.originalLanguage,
      })
      .from(movies)
      .where(eq(movies.published, true)),
    db
      .select({ movieId: movieTags.movieId, name: tags.name })
      .from(movieTags)
      .innerJoin(tags, eq(movieTags.tagId, tags.id)),
  ]);

  const tagsByMovieId = groupBy(tagRows, (t) => t.movieId);
  return movieRows.map((m) => ({
    movieId: m.id,
    title: m.title,
    slug: m.slug,
    thumbnailUrl: m.thumbnailUrl,
    overview: m.description,
    language: m.originalLanguage,
    tags: (tagsByMovieId.get(m.id) ?? []).map((t) => t.name),
  }));
}

export async function searchMoviesRag(
  query: string,
  topK = 5
): Promise<RagMovieResult[]> {
  if (!query?.trim()) return [];
  const [embedding] = await nvidiaEmbed([query], "query");
  if (!embedding) return [];

  const results = await vectorIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return results
    .filter((r) => r.metadata?.type === "movie" && r.metadata.slug)
    .map((r) => ({
      title: r.metadata?.source ?? "",
      slug: r.metadata?.slug ?? "",
      thumbnailUrl: r.metadata?.thumbnailUrl ?? "",
      description: r.metadata?.overview ?? "",
    }));
}