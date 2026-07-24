import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export interface HeroItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  releaseDate?: string | null;
  durationSeconds?: number | null;
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

// Drizzle dynamic table references require `any` — see https://orm.drizzle.team/docs/dynamic-query-building
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleTable = any;

interface FeaturedServiceConfig {
  cacheKey: string;
  featuredTable: DrizzleTable;
  entityTable: DrizzleTable;
  fkColumn: DrizzleTable;
  entityIdColumn: DrizzleTable;
  tagJunctionTable: DrizzleTable;
  tagEntityFkColumn: DrizzleTable;
  entityIdField: string;
  extraHeroColumns?: Record<string, unknown>;
}

export function createFeaturedService(config: FeaturedServiceConfig) {
  const {
    cacheKey,
    featuredTable,
    entityTable,
    fkColumn,
    entityIdColumn,
    tagJunctionTable,
    tagEntityFkColumn,
    entityIdField,
    extraHeroColumns,
  } = config;

  async function getHero(): Promise<HeroItem[]> {
    return cacheGetOrSet(`home:featured-${cacheKey}`, CACHE_TTL.SLOW, async () => {
      const selectColumns: Record<string, DrizzleTable> = {
        id: entityTable.id,
        title: entityTable.title,
        slug: entityTable.slug,
        description: entityTable.description,
        thumbnailUrl: entityTable.thumbnailUrl,
        backdropUrl: entityTable.backdropUrl,
        ...extraHeroColumns,
      };

      const items = (await db
        .select(selectColumns as DrizzleTable)
        .from(featuredTable)
        .innerJoin(entityTable, eq(fkColumn, entityIdColumn))
        .orderBy(asc(featuredTable.displayOrder))) as DrizzleTable[];

      if (items.length > 0) {
        const featuredIds = items.map((m: { id: number }) => m.id);
        const tagRows: DrizzleTable[] = await db
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
    const rows: DrizzleTable[] = await db
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
    const [created] = await db
      .insert(featuredTable)
      .values({ [entityIdField]: entityId, displayOrder: nextOrder } as DrizzleTable)
      .returning();

    return created;
  }

  async function updateOrder(id: number, displayOrder: number) {
    const [updated] = await db
      .update(featuredTable)
      .set({ displayOrder })
      .where(eq(featuredTable.id, id))
      .returning();
    if (!updated) return null;
    return updated;
  }

  async function remove(id: number): Promise<boolean> {
    const [deleted] = await db.delete(featuredTable).where(eq(featuredTable.id, id)).returning();
    if (!deleted) return false;
    return true;
  }

  return { getHero, listAdmin, add, updateOrder, remove };
}
