import { and, eq, count, inArray, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import {
  parseAdminListQuery,
  type AdminListParams,
  type AdminListConfig,
} from "@/lib/list-query";

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

interface ExecutePaginatedArgs {
  select: Record<string, AnyPgColumn | SQL>;
  table: AnyPgTable;
  junction?: AnyPgTable;
  junctionFk?: AnyPgColumn;
  junctionTagId?: AnyPgColumn;
  bodyId: AnyPgColumn;
  whereClause: SQL | undefined;
  cursorWhere: SQL | undefined;
  orderBy: SQL;
  limit: number;
  offset: number;
  hasTagFilter: boolean;
  tagIds: number[];
  conditions?: SQL[];
  errorContext: string;
}

function toMeta(limit: number, offset: number, total: number): PaginatedMeta {
  return {
    page: Math.floor(offset / limit) + 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: offset + limit < total,
  };
}

function effectiveOffset(cursorWhere: SQL | undefined, offset: number): number {
  return cursorWhere ? 0 : offset;
}

async function executePaginated<T>({
  select,
  table,
  junction,
  junctionFk,
  junctionTagId,
  bodyId,
  whereClause,
  cursorWhere,
  orderBy,
  limit,
  offset,
  hasTagFilter,
  tagIds,
  conditions,
  errorContext,
}: ExecutePaginatedArgs): Promise<PaginatedResult<T>> {
  const baseConditions = [...(conditions ?? [])];
  if (whereClause) baseConditions.push(whereClause);
  const queryOffset = effectiveOffset(cursorWhere, offset);

  try {
    let dataPromise: PromiseLike<unknown[]>;
    let countPromise: PromiseLike<{ value: number }[]>;

    if (hasTagFilter && junction && junctionFk && junctionTagId) {
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

      dataPromise = db
        .select(select)
        .from(table)
        .innerJoin(junction, eq(junctionFk, bodyId))
        .where(where)
        .groupBy(bodyId)
        .having(having)
        .orderBy(orderBy)
        .limit(limit)
        .offset(queryOffset);
      countPromise = db.select({ value: count() }).from(countSub);
    } else {
      const where = and(...baseConditions, ...(cursorWhere ? [cursorWhere] : []));
      dataPromise = db
        .select(select)
        .from(table)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(queryOffset);
      countPromise = db.select({ value: count() }).from(table).where(where);
    }

    const [dataRows, totalRows] = await Promise.all([dataPromise, countPromise]);
    const total = totalRows[0].value;
    return { data: dataRows as unknown as T[], meta: toMeta(limit, offset, total) };
  } catch (err) {
    logger.error(errorContext, "DB error:", err);
    throw err;
  }
}

export async function paginatedQuery<T>(
  params: AdminListParams,
  config: AdminListConfig,
  executeArgs: Omit<ExecutePaginatedArgs, "whereClause" | "cursorWhere" | "orderBy" | "limit" | "offset" | "hasTagFilter" | "tagIds">
): Promise<PaginatedResult<T>> {
  const parsed = parseAdminListQuery(params, config);
  return executePaginated<T>({
    ...executeArgs,
    whereClause: parsed.whereClause,
    cursorWhere: parsed.cursorWhere,
    orderBy: parsed.orderBy,
    limit: params.limit,
    offset: parsed.offset,
    hasTagFilter: parsed.hasTagFilter,
    tagIds: parsed.tagIds,
  });
}
