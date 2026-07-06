import { db } from "@/db";
import { series, seasons, episodes, seriesTags, tags } from "@/db/schema";
import { eq, and, inArray, asc, desc, ilike, sql, count, type SQL } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { pickDefined } from "@/lib/db-utils";
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
}

const seriesListConfig: AdminListConfig = {
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
    })
    .returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(seriesTags).values(
      data.tagIds.map((tagId) => ({ seriesId: createdSeries.id, tagId }))
    );
  }

  invalidateCache("series-list");
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
  }
) {
  const [existingSeries] = await db.select().from(series).where(eq(series.id, id)).limit(1);
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

  const [updatedSeries] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  invalidateCache("series-list");
  return updatedSeries;
}

export async function deleteSeries(id: number) {
  const [existing] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!existing) return false;

  await db.delete(seriesTags).where(eq(seriesTags.seriesId, id));
  await db.delete(series).where(eq(series.id, id));

  invalidateCache("series-list");
  return true;
}

export async function listAdminSeries(args: AdminListParams) {
  const { page, limit } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, seriesListConfig);

  const [totalResult] = await db
    .select({ total: count() })
    .from(series)
    .where(whereClause);
  const total = totalResult.total;

  const seriesList = await db
    .select({
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
      backdropUrl: series.backdropUrl,
      releaseDate: series.releaseDate,
      trailerUrl: series.trailerUrl,
      tmdbId: series.tmdbId,
      originalLanguage: series.originalLanguage,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    })
    .from(series)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const seriesIds = seriesList.map((s) => s.id);

  const [tagRows, seasonCounts] = await Promise.all([
    seriesIds.length > 0
      ? db
          .select({ seriesId: seriesTags.seriesId, id: tags.id, name: tags.name, createdAt: tags.createdAt })
          .from(seriesTags)
          .innerJoin(tags, eq(seriesTags.tagId, tags.id))
          .where(inArray(seriesTags.seriesId, seriesIds))
      : Promise.resolve([]),
    seriesIds.length > 0
      ? db
          .select({ seriesId: seasons.seriesId, value: count() })
          .from(seasons)
          .where(inArray(seasons.seriesId, seriesIds))
          .groupBy(seasons.seriesId)
      : Promise.resolve([]),
  ]);

  const tagsBySeriesId: Record<number, { id: number; name: string }[]> = {};
  for (const row of tagRows) {
    if (!tagsBySeriesId[row.seriesId]) tagsBySeriesId[row.seriesId] = [];
    tagsBySeriesId[row.seriesId].push({ id: row.id, name: row.name });
  }

  const seasonCountMap: Record<number, number> = {};
  for (const row of seasonCounts) {
    seasonCountMap[row.seriesId] = Number(row.value);
  }

  const seriesWithMeta = seriesList.map((s) => ({
    ...s,
    tags: tagsBySeriesId[s.id] || [],
    seasonCount: seasonCountMap[s.id] || 0,
  }));

  return {
    items: seriesWithMeta,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listSeries(args: {
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  const { q, tagsParam, page = 1, limit = DEFAULT_PAGE_SIZE, sortBy = "createdAt", sortDir = "desc" } = args;
  const offset = (page - 1) * limit;

  const sortCol = seriesListConfig.sortableColumns[sortBy] || series.createdAt;
  const orderDir = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const conditions: SQL[] = [];
  if (q) conditions.push(ilike(series.title, `%${q}%`));

  if (tagsParam) {
    const tagIds = tagsParam.split(",").map(Number);
    try {
      const [seriesRows, totalRows] = await Promise.all([
        db
          .select({
            id: series.id,
            title: series.title,
            slug: series.slug,
            thumbnailUrl: series.thumbnailUrl,
          })
          .from(series)
          .innerJoin(seriesTags, eq(series.id, seriesTags.seriesId))
          .where(
            conditions.length > 0
              ? and(...conditions, inArray(seriesTags.tagId, tagIds))
              : inArray(seriesTags.tagId, tagIds)
          )
          .groupBy(series.id)
          .having(sql`count(distinct ${seriesTags.tagId}) = ${tagIds.length}`)
          .orderBy(orderDir)
          .limit(limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(
            db
              .select({ id: series.id })
              .from(series)
              .innerJoin(seriesTags, eq(series.id, seriesTags.seriesId))
              .where(
                conditions.length > 0
                  ? and(...conditions, inArray(seriesTags.tagId, tagIds))
                  : inArray(seriesTags.tagId, tagIds)
              )
              .groupBy(series.id)
              .having(sql`count(distinct ${seriesTags.tagId}) = ${tagIds.length}`)
              .as("filtered")
          ),
      ]);
      return { series: seriesRows, total: totalRows[0].value };
    } catch (err) {
      logger.error("listSeries", "DB error:", err);
      return { series: [], total: 0 };
    }
  }

  try {
    const [seriesRows, totalRows] = await Promise.all([
      db
        .select({
          id: series.id,
          title: series.title,
          slug: series.slug,
          thumbnailUrl: series.thumbnailUrl,
        })
        .from(series)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderDir)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(series)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);
    return { series: seriesRows, total: totalRows[0].value };
  } catch (err) {
    logger.error("listSeries", "DB error:", err);
    return { series: [], total: 0 };
  }
}

export async function getSeriesBySlug(slug: string) {
  const [seriesResult, tagRows] = await Promise.all([
    db.select().from(series).where(eq(series.slug, slug)).limit(1),
    db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .innerJoin(seriesTags, eq(tags.id, seriesTags.tagId))
      .innerJoin(series, eq(seriesTags.seriesId, series.id))
      .where(eq(series.slug, slug)),
  ]);

  if (seriesResult.length === 0) return null;

  const seasonRows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.seriesId, seriesResult[0].id))
    .orderBy(asc(seasons.seasonNumber));

  const seasonIds = seasonRows.map((s) => s.id);
  const episodeRows =
    seasonIds.length > 0
      ? await db
          .select()
          .from(episodes)
          .where(inArray(episodes.seasonId, seasonIds))
          .orderBy(asc(episodes.episodeNumber))
      : [];

  const episodesBySeason: Record<number, EpisodeRow[]> = {};
  for (const ep of episodeRows) {
    if (!episodesBySeason[ep.seasonId]) episodesBySeason[ep.seasonId] = [];
    episodesBySeason[ep.seasonId].push(ep);
  }

  return {
    ...seriesResult[0],
    tags: tagRows,
    seasons: seasonRows.map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      episodes: episodesBySeason[s.id] || [],
    })),
  };
}

export async function getAdminSeriesById(id: number) {
  const [seriesRow] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!seriesRow) return null;

}


