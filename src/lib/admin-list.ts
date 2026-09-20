import { and, or, ilike, asc, desc, gt, type SQL, type AnyColumn } from "drizzle-orm";

export interface AdminListParams {
  page: number;
  limit: number;
  cursor?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  columnFilters?: Record<string, string>;
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
}

export function parseAdminListQuery(
  args: AdminListParams,
  config: AdminListConfig
): ParsedListQuery {
  const { page, limit, cursor, search, sortBy, sortDir, columnFilters = {} } = args;
  const offset = (page - 1) * limit;

  const searchConditions: SQL[] = [];
  if (search && config.searchColumns) {
    for (const col of config.searchColumns) {
      searchConditions.push(ilike(col, `%${search}%`));
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

  const cursorWhere = cursor ? gt(config.sortableColumns["id"] as AnyColumn, cursor) : undefined;

  return { offset, cursorWhere, whereClause, orderBy };
}
