import { db } from "@/db";
import { tags, movieTags } from "@/db/schema";
import { eq, and, asc, desc, ilike, count, inArray, type AnyColumn, type SQL } from "drizzle-orm";
import { invalidateCache, cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";

export async function getAllTags() {
  return cacheGetOrSet("tags:all", CACHE_TTL.DEFAULT, () => db.select().from(tags));
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
      .select({ id: tags.id, name: tags.name, createdAt: tags.createdAt })
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

  return { items: tagsWithCount, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createTag(name: string) {
  const [createdTag] = await db.insert(tags).values({ name: name.trim() }).returning();
  invalidateCache("tags");
  return createdTag;
}

export async function updateTag(tagId: number, name: string | undefined) {
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return { error: "Invalid name" };
    await db.update(tags).set({ name: name.trim() }).where(eq(tags.id, tagId));
  }

  const [updatedTag] = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1);
  if (!updatedTag) return { error: "Tag Not Found" };

  invalidateCache("tags");
  return { tag: updatedTag };
}

export async function deleteTag(tagId: number) {
  await db.delete(tags).where(eq(tags.id, tagId));
  invalidateCache("tags");
  return true;
}
