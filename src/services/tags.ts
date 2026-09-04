import { db } from "@/db";
import { tags, movieTags, movies } from "@/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { paginatedList } from "@/services/paginated-list";
import { moviesListConfig } from "@/services/config";
import { attachTags } from "@/services/movies";

export async function getAllTags() {
  return cacheGetOrSet("tags:all", CACHE_TTL.SLOW, () =>
    db.select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt }).from(tags)
  );
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

  const [totalResult, tagsList] = await Promise.all([
    db.select({ total: count() }).from(tags).where(whereClause),
    db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
      .from(tags)
      .where(whereClause)
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
    movieCount: counts[t.id] || 0,
  }));

  return { data: tagsWithCount, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
}

export async function createTag(name: string, imageUrl?: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [createdTag] = await db.insert(tags).values({ name: name.trim(), slug, imageUrl: imageUrl || null }).returning();
  return createdTag;
}

export async function updateTag(tagId: number, name?: string, imageUrl?: string) {
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return { error: { message: "Invalid name", code: "INVALID_NAME" } };
    updates.name = name.trim();
    updates.slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  if (imageUrl !== undefined) {
    updates.imageUrl = imageUrl || null;
  }
  if (Object.keys(updates).length > 0) {
    const [updatedTag] = await db
      .update(tags)
      .set(updates)
      .where(eq(tags.id, tagId))
      .returning({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt });
    if (updatedTag) return { tag: updatedTag };
  }

  const [existingTag] = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);
  if (!existingTag) return { error: { message: "Tag Not Found", code: "NOT_FOUND" } };

  return { tag: existingTag };
}

export async function deleteTag(tagId: number) {
  await db.delete(tags).where(eq(tags.id, tagId));
  return true;
}

export async function getTagBySlug(slug: string) {
  return cacheGetOrSet(`tag:${slug}`, CACHE_TTL.SLOW, async () => {
    const [tag] = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    return tag ?? null;
  });
}

export async function getMoviesByTag(slug: string, page: number, limit: number) {
  return cacheGetOrSet(`tag-movies:${slug}:${page}:${limit}`, CACHE_TTL.DEFAULT, async () => {
    const tag = await getTagBySlug(slug);
    if (!tag) return { error: { message: "Tag not found", code: "NOT_FOUND" } };

    const tagIdParam = String(tag.id);
    const result = await paginatedList<{
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
  }>({
    config: moviesListConfig,
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
    searchColumn: movies.title,
    conditions: [eq(movies.published, true)],
    tagsParam: tagIdParam,
    page,
    limit,
    errorContext: "getMoviesByTag",
  });

    const data = await attachTags(result.data);
    return { data, meta: result.meta, tag };
  });
}
