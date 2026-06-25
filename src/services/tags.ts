import { db } from "@/db";
import { tags, movieTags } from "@/db/schema";
import { eq, like, count } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { cacheGetOrSet } from "@/lib/cache";

export async function getAllTags() {
  return cacheGetOrSet("tags:all", 300, () => db.select().from(tags));
}

export async function listAdminTags(args: { page: number; limit: number; search: string }) {
  const { page, limit, search } = args;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (search) conditions.push(like(tags.name, `%${search}%`));
  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

  const [totalResult, tagsList] = await Promise.all([
    db.select({ total: count() }).from(tags).where(whereClause),
    db
    .select({ id: tags.id, name: tags.name, createdAt: tags.createdAt, movieCount: count(movieTags.movieId) })
    .from(tags)
    .leftJoin(movieTags, eq(tags.id, movieTags.tagId))
    .where(whereClause)
    .groupBy(tags.id)
    .orderBy(tags.name)
    .limit(limit)
    .offset(offset)
  ]);
  const total = totalResult[0].total;

  return { tags: tagsList, total, page, limit, totalPages: Math.ceil(total / limit) };
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
