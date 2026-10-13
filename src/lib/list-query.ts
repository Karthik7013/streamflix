import { and, or, ilike, asc, desc, gt, type SQL, type AnyColumn } from "drizzle-orm";

export interface AdminListParams {
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

export interface AdminListConfig {
  sortableColumns: Record<string, AnyColumn>;
  filterableColumns?: Record<string, AnyColumn>;
  searchColumns?: AnyColumn[];
  defaultSortBy?: string;
  defaultSortDir?: "asc" | "desc";
}

export interface ParsedListQuery {
  offset: number;
  cursorWhere: SQL | undefined;
  whereClause: SQL | undefined;
  orderBy: SQL;
  tagIds: number[];
  hasTagFilter: boolean;
}

export function parseAdminListQuery(
  args: AdminListParams,
  config: AdminListConfig
): ParsedListQuery {
  const { page, limit, cursor, search, q, sortBy, sortDir, columnFilters = {}, tagsParam } = args;
  const offset = (page - 1) * limit;
  const searchText = q ?? search;

  const searchConditions: SQL[] = [];
  if (searchText && config.searchColumns) {
    for (const col of config.searchColumns) {
      searchConditions.push(ilike(col, `%${searchText}%`));
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

  const tagIds = tagsParam ? tagsParam.split(",").map(Number).filter((n) => !isNaN(n)) : [];

  const cursorWhere = cursor && config.sortableColumns["id"]
    ? gt(config.sortableColumns["id"] as AnyColumn, cursor)
    : undefined;

  return { offset, cursorWhere, whereClause, orderBy, tagIds, hasTagFilter: tagIds.length > 0 };
}
