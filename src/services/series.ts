import { db } from "@/db";
import { series, seasons, episodes, seriesTags, tags } from "@/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { paginatedList } from "@/services/paginated-list";
import { seriesListConfig } from "@/services/config";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { EpisodeRow } from "@/services/episodes";

export interface SeriesRow {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null;
  tmdbId: number | null;
  originalLanguage: string | null;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export async function listSeries(args: {
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  const { q, tagsParam, page = 1, limit = DEFAULT_PAGE_SIZE, sortBy, sortDir = "desc" } = args;
  return cacheGetOrSet(`series-list:${q ?? "all"}:${tagsParam ?? "all"}:${page}:${limit}:${sortBy ?? "default"}:${sortDir}`, CACHE_TTL.SLOW, async () => {
    return paginatedList<{ id: number; title: string; slug: string; thumbnailUrl: string }>({
      config: seriesListConfig,
      select: {
        id: series.id,
        title: series.title,
        slug: series.slug,
        thumbnailUrl: series.thumbnailUrl,
      },
      table: series,
      junction: seriesTags,
      junctionFk: seriesTags.seriesId,
      junctionTagId: seriesTags.tagId,
      bodyId: series.id,
      searchColumn: series.title,
      conditions: [eq(series.published, true)],
      q: args.q,
      tagsParam: args.tagsParam,
      page: args.page,
      limit: args.limit,
      sortBy: args.sortBy,
      sortDir: args.sortDir,
      errorContext: "listSeries",
    });
  });
}

interface SeriesSeason {
  id: number;
  seasonNumber: number;
  title: string | null;
  episodes: EpisodeRow[];
}

export async function getSeriesSeasons(seriesId: number): Promise<SeriesSeason[]> {
  return cacheGetOrSet(`series:seasons:${seriesId}`, CACHE_TTL.DEFAULT, async () => {
    const seasonRows = await db
      .select({ id: seasons.id, seriesId: seasons.seriesId, seasonNumber: seasons.seasonNumber, title: seasons.title, description: seasons.description, thumbnailUrl: seasons.thumbnailUrl, releaseDate: seasons.releaseDate, createdAt: seasons.createdAt, updatedAt: seasons.updatedAt })
      .from(seasons)
      .where(eq(seasons.seriesId, seriesId))
      .orderBy(asc(seasons.seasonNumber));

    const seasonIds = seasonRows.map((s) => s.id);
    const episodeRows =
      seasonIds.length > 0
          ? await db
            .select({ id: episodes.id, seasonId: episodes.seasonId, episodeNumber: episodes.episodeNumber, title: episodes.title, slug: episodes.slug, description: episodes.description, videoUrl: episodes.videoUrl, thumbnailUrl: episodes.thumbnailUrl, tmdbStillPath: episodes.tmdbStillPath, backdropUrl: episodes.backdropUrl, durationSeconds: episodes.durationSeconds, releaseDate: episodes.releaseDate, createdAt: episodes.createdAt, updatedAt: episodes.updatedAt })
            .from(episodes)
            .where(inArray(episodes.seasonId, seasonIds))
            .orderBy(asc(episodes.episodeNumber))
        : [];

    const episodesBySeason: Record<number, EpisodeRow[]> = {};
    for (const ep of episodeRows) {
      if (!episodesBySeason[ep.seasonId]) episodesBySeason[ep.seasonId] = [];
      episodesBySeason[ep.seasonId].push(ep);
    }

    return seasonRows.map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      episodes: episodesBySeason[s.id] || [],
    }));
  });
}

export async function getSeriesBySlug(slug: string) {
  const detail = await cacheGetOrSet(`series:${slug}`, CACHE_TTL.SLOW, async () => {
    const [seriesResult, tagRows] = await Promise.all([
      db.select({ id: series.id, title: series.title, slug: series.slug, description: series.description, thumbnailUrl: series.thumbnailUrl, backdropUrl: series.backdropUrl, trailerUrl: series.trailerUrl, releaseDate: series.releaseDate, createdAt: series.createdAt, updatedAt: series.updatedAt, tmdbId: series.tmdbId, originalLanguage: series.originalLanguage, published: series.published }).from(series).where(and(eq(series.slug, slug), eq(series.published, true))).limit(1),
      db
        .select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(tags)
        .innerJoin(seriesTags, eq(tags.id, seriesTags.tagId))
        .innerJoin(series, eq(seriesTags.seriesId, series.id))
        .where(eq(series.slug, slug)),
    ]);

    if (seriesResult.length === 0) return null;

    return { ...seriesResult[0], tags: tagRows };
  });

  if (!detail) return null;

  const seasons = await getSeriesSeasons(detail.id);

  return { ...detail, seasons };
}