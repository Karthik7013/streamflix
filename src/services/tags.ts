import { db } from "@/db";
import { tags, movieTags, movies } from "@/db/schema";
import { eq, and, count, inArray, or, gt, asc } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";
import { cacheGetOrSet, CACHE_TTL, invalidateCache } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import { ErrorCode } from "@/lib/error-codes";
import { attachTags } from "@/services/movies";
import { generateSlug } from "@/lib/validation";

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.replace(/[\r\n\t]+/g, "").trim();
  return clean || null;
}

async function invalidateTagCaches() {
  await invalidateCache("tags");
  await invalidateCache("tag-movies");
}

export async function getAllTags() {
  const rows = await cacheGetOrSet(cacheKeys.tagsAll, CACHE_TTL.SLOW, () =>
    db.select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt }).from(tags)
  );
  return rows.map((t) => ({ ...t, imageUrl: sanitizeImageUrl(t.imageUrl) }));
}

const tagListConfig: AdminListConfig = {
  sortableColumns: {
    name: tags.name,
    createdAt: tags.createdAt,
  },
  filterableColumns: {
    name: tags.name,
  },
  searchColumns: [tags.name],
  defaultSortBy: "name",
};

export async function listAdminTags(args: AdminListParams) {
  const { page, limit } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, tagListConfig);

  const finalWhere = whereClause;

  const [totalResult, tagsList] = await Promise.all([
    db.select({ total: count() }).from(tags).where(finalWhere),
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
      .from(tags)
      .where(finalWhere)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);
  const total = totalResult[0].total;

  const tagIds = tagsList.map(t => t.id);
  const counts: Record<number, number> = {};
  if (tagIds.length > 0) {
    const movieCounts = await db
      .select({
        tagId: movieTags.tagId,
        value: count(),
      })
      .from(movieTags)
      .where(inArray(movieTags.tagId, tagIds))
      .groupBy(movieTags.tagId);

    for (const c of movieCounts) {
      counts[c.tagId] = Number(c.value);
    }
  }

  const tagsWithCount = tagsList.map((t) => ({
    ...t,
    imageUrl: sanitizeImageUrl(t.imageUrl),
    movieCount: counts[t.id] || 0,
  }));

  return { data: tagsWithCount, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
}

export async function createTag(name: string, imageUrl?: string) {
  const slug = generateSlug(name);
  const [createdTag] = await db.insert(tags).values({ name: name.trim(), slug, imageUrl: sanitizeImageUrl(imageUrl) }).returning();
  await invalidateTagCaches();
  return createdTag;
}

export async function updateTag(tagId: number, name?: string, imageUrl?: string) {
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return { error: { message: "Invalid name", code: ErrorCode.ValidationError } };
    updates.name = name.trim();
    updates.slug = generateSlug(name.trim());
  }
  if (imageUrl !== undefined) {
    updates.imageUrl = sanitizeImageUrl(imageUrl);
  }
  if (Object.keys(updates).length > 0) {
    const [updatedTag] = await db
      .update(tags)
      .set(updates)
      .where(eq(tags.id, tagId))
      .returning({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt });
    if (updatedTag) {
      await invalidateTagCaches();
      return { tag: updatedTag };
    }
  }

  const [existingTag] = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);
  if (!existingTag) return { error: { message: "Tag Not Found", code: ErrorCode.NotFound } };

  return { tag: existingTag };
}

export async function deleteTag(tagId: number) {
  await db.delete(tags).where(eq(tags.id, tagId));
  await invalidateTagCaches();
  return true;
}

export async function getTagBySlug(slug: string) {
  const tag = await cacheGetOrSet(cacheKeys.tag(slug), CACHE_TTL.SLOW, async () => {
    const [row] = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    return row ?? null;
  });
  return tag ? { ...tag, imageUrl: sanitizeImageUrl(tag.imageUrl) } : null;
}

export async function getMoviesByTag(slug: string, cursor: string | undefined, limit: number) {
  return cacheGetOrSet(cacheKeys.tagMovies(slug, cursor, limit), CACHE_TTL.DEFAULT, async () => {
    const tag = await getTagBySlug(slug);
    if (!tag) return { error: { message: "Tag Not Found", code: ErrorCode.NotFound } };

    const c = decodeCursor<{ t: string; id: number }>(cursor);
    const cursorWhere = c
      ? or(gt(movies.title, c.t), and(eq(movies.title, c.t), gt(movies.id, c.id)))
      : undefined;

    const rows = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies)
      .innerJoin(movieTags, eq(movieTags.movieId, movies.id))
      .where(and(eq(movies.published, true), eq(movieTags.tagId, tag.id), ...(cursorWhere ? [cursorWhere] : [])))
      .orderBy(asc(movies.title), asc(movies.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ t: last.title, id: last.id }) : null;

    const data = await attachTags(pageRows);
    return { data, tag, nextCursor, hasMore };
  });
}
