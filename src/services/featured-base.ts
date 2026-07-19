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

interface FeaturedAdminItem {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FeaturedServiceConfig {
  featuredTable: any;
  entityTable: any;
  fkColumn: any;
  entityIdColumn: any;
  tagJunctionTable: any;
  tagEntityFkColumn: any;
  cachePrefix: CacheScope;
  entityIdField: string;
  extraHeroColumns?: Record<string, unknown>;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectColumns: Record<string, any> = {
        id: entityTable.id,
        title: entityTable.title,
        slug: entityTable.slug,
        description: entityTable.description,
        thumbnailUrl: entityTable.thumbnailUrl,
        backdropUrl: entityTable.backdropUrl,
        ...extraHeroColumns,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select(selectColumns as any)
        .from(featuredTable)
        .innerJoin(entityTable, eq(fkColumn, entityIdColumn))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .orderBy(asc(featuredTable.displayOrder))) as any[];

      if (items.length > 0) {
        const featuredIds = items.map((m: { id: number }) => m.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tagRows: any[] = await db
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
          item.tags = tagsByEntity[item.id] || [];
        }
      }

      return items;
    });
  }

  async function listAdmin(): Promise<FeaturedAdminItem[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await db
      .select({
        id: featuredTable.id,
        displayOrder: featuredTable.displayOrder,
        title: entityTable.title,
        slug: entityTable.slug,
        thumbnailUrl: entityTable.thumbnailUrl,
      })
      .from(featuredTable)
      .innerJoin(entityTable, eq(fkColumn, entityIdColumn))
      .orderBy(asc(featuredTable.displayOrder));

    return rows.map((r) => ({ ...r, [entityIdField]: r.id }));
  }

  async function add(entityId: number) {
    const [maxResult] = await db
      .select({ max: sql<number>`COALESCE(MAX(${featuredTable.displayOrder}), -1)` })
      .from(featuredTable);

    const nextOrder = (maxResult?.max ?? -1) + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [created] = await db
      .insert(featuredTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
