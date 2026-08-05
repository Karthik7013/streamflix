import { and, asc, count, desc, eq, ilike, inArray, sql, type SQL, type AnyColumn } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { AdminListConfig } from "@/lib/admin-list";

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedListResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

interface PaginatedListArgs {
  config: AdminListConfig;
  select: Record<string, AnyPgColumn | SQL>;
  table: AnyPgTable;
  junction: AnyPgTable;
  junctionFk: AnyPgColumn;
  junctionTagId: AnyPgColumn;
  bodyId: AnyPgColumn;
  searchColumn: AnyPgColumn;
  conditions: SQL[];
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  errorContext: string;
}

export async function paginatedList<T>({
  config,
  select,
  table,
  junction,
  junctionFk,
  junctionTagId,
  bodyId,
  searchColumn,
  conditions,
  q,
  tagsParam,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  sortBy,
  sortDir = "desc",
  errorContext,
}: PaginatedListArgs): Promise<PaginatedListResult<T>> {
  const offset = (page - 1) * limit;

  const sortColumn =
    config.sortableColumns[sortBy || ""] ||
    config.sortableColumns[config.defaultSortBy || "createdAt"] ||
    (bodyId as AnyColumn);
  const orderDir = sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const baseConditions = [...conditions];
  if (q) baseConditions.push(ilike(searchColumn, `%${q}%`));

  const meta = (total: number): PaginatedMeta => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  });

  try {
    let rows: T[];
    let total: number;

    if (tagsParam) {
      const tagIds = tagsParam.split(",").map(Number);
      const where = and(...baseConditions, inArray(junctionTagId, tagIds));
      const having = sql`count(distinct ${junctionTagId}) = ${tagIds.length}`;
      const countSub = db
        .select({ id: bodyId })
        .from(table)
        .innerJoin(junction, eq(junctionFk, bodyId))
        .where(where)
        .groupBy(bodyId)
        .having(having)
        .as("filtered");
      const [dataRows, totalRows] = await Promise.all([
        db
          .select(select)
          .from(table)
          .innerJoin(junction, eq(junctionFk, bodyId))
          .where(where)
          .groupBy(bodyId)
          .having(having)
          .orderBy(orderDir)
          .limit(limit)
          .offset(offset),
        db.select({ value: count() }).from(countSub),
      ]);
      rows = dataRows as unknown as T[];
      total = totalRows[0].value;
    } else {
      const where = baseConditions.length > 0 ? and(...baseConditions) : undefined;
      const [dataRows, totalRows] = await Promise.all([
        db
          .select(select)
          .from(table)
          .where(where)
          .orderBy(orderDir)
          .limit(limit)
          .offset(offset),
        db.select({ value: count() }).from(table).where(where),
      ]);
      rows = dataRows as unknown as T[];
      total = totalRows[0].value;
    }

    return { data: rows, meta: meta(total) };
  } catch (err) {
    logger.error(errorContext, "DB error:", err);
    return { data: [], meta: { page, limit, total: 0, totalPages: 0, hasMore: false } };
  }
}