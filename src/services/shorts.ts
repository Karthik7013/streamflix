import { db } from "@/db";
import { shorts } from "@/db/schema";
import type { Short } from "@/db/schema";
import { desc, lt } from "drizzle-orm";

export interface ShortsPage {
  data: Short[];
  nextCursor: number | null;
  hasMore: boolean;
}

export async function getShorts({ limit = 10, cursor }: { limit?: number; cursor?: number }): Promise<ShortsPage> {
  const query = db
    .select()
    .from(shorts)
    .orderBy(desc(shorts.id))
    .limit(limit + 1);

  if (cursor) {
    query.where(lt(shorts.id, cursor));
  }

  const rows = await query;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}
