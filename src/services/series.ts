import { db } from "@/db";
import { series, seasons, episodes, seriesTags, tags } from "@/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { pickDefined } from "@/lib/db-utils";
import { type AdminListConfig } from "@/lib/admin-list";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { paginatedList } from "@/services/paginated-list";
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

export const seriesListConfig: AdminListConfig = {
  sortableColumns: {
    id: series.id,
    title: series.title,
    createdAt: series.createdAt,
    releaseDate: series.releaseDate,
    updatedAt: series.updatedAt,
  },
  filterableColumns: {
    title: series.title,
    slug: series.slug,
    description: series.description,
  },
  searchColumns: [series.title],
  defaultSortBy: "createdAt",
};

export async function createSeries(data: {
  title: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  releaseDate?: string | null;
  tagIds?: number[];
  tmdbId?: number | null;
  originalLanguage?: string | null;
  published?: boolean;
}) {
  const [createdSeries] = await db
    .insert(series)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? "",
      backdropUrl: data.backdropUrl ?? null,
      trailerUrl: data.trailerUrl ?? null,
      releaseDate: data.releaseDate ?? null,
      tmdbId: data.tmdbId ?? null,
      originalLanguage: data.originalLanguage ?? null,
      published: data.published ?? false,
    })
    .returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(seriesTags).values(
      data.tagIds.map((tagId) => ({ seriesId: createdSeries.id, tagId }))
    );
  }


  return createdSeries;
}

export async function updateSeries(
  id: number,
  data: {
    title?: string;
    slug?: string;
    description?: string | null;
    thumbnailUrl?: string;
    backdropUrl?: string | null;
    trailerUrl?: string | null;
    releaseDate?: string | null;
    tagIds?: number[];
    tmdbId?: number | null;
    originalLanguage?: string | null;
    published?: boolean;
  }
) {
  const [existingSeries] = await db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1);
  if (!existingSeries) return null;

  const { tagIds, ...fields } = data;
  const updateData = pickDefined(fields) as Record<string, unknown>;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(series).set(updateData).where(eq(series.id, id));
  }

  if (tagIds && Array.isArray(tagIds)) {
    await db.delete(seriesTags).where(eq(seriesTags.seriesId, id));
    if (tagIds.length > 0) {
      await db.insert(seriesTags).values(
        tagIds.map((tagId) => ({ seriesId: id, tagId }))
      );
    }
  }

  const [updatedSeries] = await db.select({ id: series.id, title: series.title, slug: series.slug, description: series.description, thumbnailUrl: series.thumbnailUrl, backdropUrl: series.backdropUrl, trailerUrl: series.trailerUrl, releaseDate: series.releaseDate, createdAt: series.createdAt, updatedAt: series.updatedAt, tmdbId: series.tmdbId, originalLanguage: series.originalLanguage }).from(series).where(eq(series.id, id)).limit(1);

  return updatedSeries;
}

export async function deleteSeries(id: number) {
  const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1);
  if (!existing) return false;

  await db.delete(series).where(eq(series.id, id));


  return true;
}

export async function listSeries(args: {
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
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
        .select({ id: tags.id, name: tags.name })
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