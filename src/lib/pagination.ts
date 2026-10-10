import { and, or, ilike, asc, desc, gt, eq, count, inArray, sql, type SQL, type AnyColumn } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { logger } from "@/lib/logger";

export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: number;
  search?: string;
  q?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  columnFilters?: Record<string, string>;
  tagsParam?: string;
}

export interface PaginationConfig {
  sortableColumns: Record<string, AnyColumn>;
  filterableColumns?: Record<string, AnyColumn>;
  searchColumns?: AnyColumn[];
  defaultSortBy?: string;
  defaultSortDir?: "asc" | "desc";
}

export interface ParsedPagination {
  offset: number;
  cursorWhere: SQL | undefined;
  whereClause: SQL | undefined;
  orderBy: SQL;
  tagIds: number[] | null;
  hasTagFilter: boolean;
}

export function parsePagination(
  args: PaginationParams,
  config: PaginationConfig
): ParsedPagination {
  const { page, limit, cursor, search, q, sortBy, sortDir, columnFilters = {}, tagsParam } = args;
  const offset = (page - 1) * limit;

  const tagIds = tagsParam ? tagsParam.split(",").map(Number).filter((n) => !isNaN(n)) : [];
  const hasTagFilter = tagIds.length > 0;

  const searchTerm = q ?? search;
  const searchConditions: SQL[] = [];
  if (searchTerm && config.searchColumns) {
    for (const col of config.searchColumns) {
      searchConditions.push(ilike(col, `%${searchTerm}%`));
    }
  }

  const filterConditions: SQL[] = [];
  for (const [col, val] of Object.entries(columnFilters)) {
    const columnRef = config.filterableColumns?.[col];
    if (columnRef && val) {
      filterConditions.push(ilike(columnRef, `%${val}%`));
    }
  }

  const conditions: SQL[] = [
    ...(searchConditions.length > 0 ? [or(...searchConditions) as SQL] : []),
    ...filterConditions,
  ];

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn =
    config.sortableColumns[sortBy || ""] ||
    config.sortableColumns[config.defaultSortBy || "createdAt"];
  const orderDir = sortDir === "asc" ? asc : desc;
  const orderBy = sortColumn
    ? orderDir(sortColumn)
    : desc(config.sortableColumns[config.defaultSortBy || "createdAt"]);

  const cursorWhere = cursor && config.sortableColumns["id"]
    ? gt(config.sortableColumns["id"] as AnyColumn, cursor)
    : undefined;

  return { offset, cursorWhere, whereClause, orderBy, tagIds, hasTagFilter };
}

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

export async function executePaginated<T>({
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
  const meta = (total: number): PaginatedMeta => ({
    page: hasTagFilter || cursorWhere ? 1 : Math.floor(offset / limit) + 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: hasTagFilter || cursorWhere ? false : offset + limit < total,
  });

  const baseConditions = [...(conditions ?? [])];
  if (whereClause) baseConditions.push(whereClause);

  try {
    let rows: T[];
    let total: number;

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

      const [dataRows, totalRows] = await Promise.all([
        db
          .select(select)
          .from(table)
          .innerJoin(junction, eq(junctionFk, bodyId))
          .where(where)
          .groupBy(bodyId)
          .having(having)
          .orderBy(orderBy)
          .limit(limit)
          .offset(cursorWhere ? 0 : offset),
        db.select({ value: count() }).from(countSub),
      ]);
      rows = dataRows as unknown as T[];
      total = totalRows[0].value;
    } else {
      const where = and(...baseConditions, ...(cursorWhere ? [cursorWhere] : []));
      const [dataRows, totalRows] = await Promise.all([
        db
          .select(select)
          .from(table)
          .where(where)
          .orderBy(orderBy)
          .limit(limit)
          .offset(cursorWhere ? 0 : offset),
        db.select({ value: count() }).from(table).where(where),
      ]);
      rows = dataRows as unknown as T[];
      total = totalRows[0].value;
    }

    return { data: rows, meta: meta(total) };
  } catch (err) {
    logger.error(errorContext, "DB error:", err);
    return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0, hasMore: false } };
  }
}

export async function paginatedQuery<T>(
  params: PaginationParams,
  config: PaginationConfig,
  executeArgs: Omit<ExecutePaginatedArgs, "whereClause" | "cursorWhere" | "orderBy" | "limit" | "offset" | "hasTagFilter" | "tagIds">
): Promise<PaginatedResult<T>> {
  const parsed = parsePagination(params, config);
  return executePaginated<T>({
    ...executeArgs,
    whereClause: parsed.whereClause,
    cursorWhere: parsed.cursorWhere,
    orderBy: parsed.orderBy,
    limit: params.limit,
    offset: parsed.offset,
    hasTagFilter: parsed.hasTagFilter,
    tagIds: parsed.tagIds ?? [],
  });
}