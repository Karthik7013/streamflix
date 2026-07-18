/* eslint-disable @typescript-eslint/no-explicit-any -- generic factory with dynamic table references */
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { invalidateCache, cacheGetOrSet, CACHE_TTL, type CacheScope } from "@/lib/cache";

export interface HeroItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  tags: { id: number; name: string }[];
}

interface FeaturedServiceConfig {
  featuredTable: any;
  entityTable: any;
  fkColumn: any;
  entityIdColumn: any;
  tagJunctionTable: any;
  tagEntityFkColumn: any;
  cachePrefix: CacheScope;
  entityIdField: string;
  extraHeroColumns?: Record<string, any>;
}

export function createFeaturedService(config: FeaturedServiceConfig) {
  const {
    featuredTable,
    entityTable,
    fkColumn,
    entityIdColumn,
    tagJunctionTable,
    tagEntityFkColumn,
    cachePrefix,
    entityIdField,
    extraHeroColumns,
  } = config;

  async function getHero(): Promise<HeroItem[]> {
    return cacheGetOrSet(`${cachePrefix}:featured`, CACHE_TTL.SLOW, async () => {
      const selectColumns: Record<string, any> = {
        id: entityTable.id,
        title: entityTable.title,
        slug: entityTable.slug,
        description: entityTable.description,
        thumbnailUrl: entityTable.thumbnailUrl,
        backdropUrl: entityTable.backdropUrl,
        ...extraHeroColumns,
      };

      const items = await db
        .select(selectColumns)
        .from(featuredTable)
        .innerJoin(entityTable, eq(fkColumn, entityIdColumn))
        .orderBy(asc(featuredTable.displayOrder));

      if (items.length > 0) {
        const featuredIds = items.map((m: any) => m.id);
        const tagRows = await db
          .select({ entityId: tagEntityFkColumn, id: tags.id, name: tags.name })
          .from(tagJunctionTable)
          .innerJoin(tags, eq(tagJunctionTable.tagId, tags.id))
          .where(inArray(tagEntityFkColumn, featuredIds));

        const tagsByEntity: Record<number, { id: number; name: string }[]> = {};
        for (const row of tagRows) {
          if (!tagsByEntity[row.entityId]) tagsByEntity[row.entityId] = [];
          tagsByEntity[row.entityId].push({ id: row.id, name: row.name });
        }

        for (const item of items) {
          (item as any).tags = tagsByEntity[(item as any).id] || [];
        }
      }

      return items as any;
    });
  }

  async function listAdmin(): Promise<any[]> {
    return db
      .select({
        id: featuredTable.id,
        [entityIdField]: fkColumn,
        displayOrder: featuredTable.displayOrder,
        title: entityTable.title,
        slug: entityTable.slug,
        thumbnailUrl: entityTable.thumbnailUrl,
      })
      .from(featuredTable)
      .innerJoin(entityTable, eq(fkColumn, entityIdColumn))
      .orderBy(asc(featuredTable.displayOrder));
  }

  async function add(entityId: number) {
    const [maxResult] = await db
      .select({ max: sql<number>`COALESCE(MAX(${featuredTable.displayOrder}), -1)` })
      .from(featuredTable);

    const nextOrder = (maxResult?.max ?? -1) + 1;
    const [created] = await db
      .insert(featuredTable)
      .values({ [entityIdField]: entityId, displayOrder: nextOrder } as any)
      .returning();

    invalidateCache(cachePrefix);
    return created;
  }

  async function updateOrder(id: number, displayOrder: number) {
    const [updated] = await db
      .update(featuredTable)
      .set({ displayOrder })
      .where(eq(featuredTable.id, id))
      .returning();
    if (!updated) return null;
    invalidateCache(cachePrefix);
    return updated;
  }

  async function remove(id: number): Promise<boolean> {
    const [deleted] = await db.delete(featuredTable).where(eq(featuredTable.id, id)).returning();
    if (!deleted) return false;
    invalidateCache(cachePrefix);
    return true;
  }

  return { getHero, listAdmin, add, updateOrder, remove };
}
