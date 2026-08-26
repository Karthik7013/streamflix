import { db } from "@/db";
import { series, seasons, seriesTags, tags } from "@/db/schema";
import { eq, and, count, inArray, type SQL } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams } from "@/lib/admin-list";
import { pickDefined } from "@/lib/db-utils";
import { seriesListConfig } from "@/services/config";

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

export async function listAdminSeries(args: AdminListParams) {
  const { page, limit, columnFilters = {} } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, seriesListConfig);
  const publishedFilter = columnFilters.published;

  const conditions: SQL[] = [];
  if (whereClause) conditions.push(whereClause);
  if (publishedFilter === "true") conditions.push(eq(series.published, true));
  else if (publishedFilter === "false") conditions.push(eq(series.published, false));

  const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, seriesList] = await Promise.all([
    db.select({ total: count() }).from(series).where(finalWhere),
    db
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
        published: series.published,
      })
      .from(series)
      .where(finalWhere)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalResult[0]?.total ?? 0;

  const seriesIds = seriesList.map((s) => s.id);

  const [tagRows, seasonCounts] = await Promise.all([
    seriesIds.length > 0
      ? db
          .select({ seriesId: seriesTags.seriesId, id: tags.id, name: tags.name, slug: tags.slug, createdAt: tags.createdAt })
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

  const tagsBySeriesId: Record<number, { id: number; name: string; slug: string }[]> = {};
  for (const row of tagRows) {
    if (!tagsBySeriesId[row.seriesId]) tagsBySeriesId[row.seriesId] = [];
    tagsBySeriesId[row.seriesId].push({ id: row.id, name: row.name, slug: row.slug });
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
    data: seriesWithMeta,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  };
}

export async function getAdminSeriesById(id: number) {
  const [seriesRow] = await db
    .select({
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
      backdropUrl: series.backdropUrl,
      trailerUrl: series.trailerUrl,
      releaseDate: series.releaseDate,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      tmdbId: series.tmdbId,
      originalLanguage: series.originalLanguage,
      published: series.published,
    })
    .from(series).where(eq(series.id, id)).limit(1);
  if (!seriesRow) return null;
  return seriesRow;
}
