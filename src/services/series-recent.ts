import { db } from "@/db";
import { series } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Top10RowItem } from "@/types";

export async function getTop10Series(): Promise<Top10RowItem[]> {
  return db
    .select({
      id: series.id,
      title: series.title,
      slug: series.slug,
      thumbnailUrl: series.thumbnailUrl,
    })
    .from(series)
    .where(eq(series.published, true))
    .orderBy(desc(series.createdAt))
    .limit(10);
}
