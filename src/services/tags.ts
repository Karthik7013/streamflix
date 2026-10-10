import { db } from "@/db";
import { tags, movieTags, movies } from "@/db/schema";
import { eq, and, count, inArray } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";
import { cacheGetOrSet, CACHE_TTL, invalidateCache } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { ErrorCode } from "@/lib/error-codes";
import { attachTags } from "@/services/movies";
import { generateSlug } from "@/lib/validation";
import { paginatedQuery } from "@/lib/pagination";

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
  const { page, limit, cursor } = args;
  const { offset, cursorWhere, whereClause, orderBy } = parseAdminListQuery(args, tagListConfig);

  const finalWhere = cursorWhere
    ? (whereClause ? and(whereClause, cursorWhere) : cursorWhere)
    : whereClause;

  const [totalResult, tagsList] = await Promise.all([
    db.select({ total: count() }).from(tags).where(finalWhere),
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
      .from(tags)
      .where(finalWhere)
      .orderBy(orderBy)
      .limit(limit)
      .offset(cursor ? 0 : offset),
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

export async function getMoviesByTag(slug: string, page: number, limit: number) {
  return cacheGetOrSet(cacheKeys.tagMovies(slug, page, limit), CACHE_TTL.DEFAULT, async () => {
    const tag = await getTagBySlug(slug);
    if (!tag) return { error: { message: "Tag Not Found", code: ErrorCode.NotFound } };

    const result = await paginatedQuery<{
      id: number;
      title: string;
      slug: string;
      thumbnailUrl: string;
    }>({
      page,
      limit,
      tagsParam: String(tag.id),
    }, {
      sortableColumns: {
        id: movies.id,
        title: movies.title,
        createdAt: movies.createdAt,
      },
      searchColumns: [movies.title],
      defaultSortBy: "title",
    }, {
      select: {
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      },
      table: movies,
      junction: movieTags,
      junctionFk: movieTags.movieId,
      junctionTagId: movieTags.tagId,
      bodyId: movies.id,
      conditions: [eq(movies.published, true)],
      errorContext: "getMoviesByTag",
    });

    const data = await attachTags(result.data);
    return { data, meta: result.meta, tag };
  });
}
