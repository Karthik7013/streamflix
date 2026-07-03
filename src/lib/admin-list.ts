import { and, ilike, asc, desc, type SQL, type AnyColumn } from "drizzle-orm";

export interface AdminListParams {
  page: number;
  limit: number;
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
  whereClause: SQL | undefined;
  orderBy: SQL;
}

export function parseAdminListQuery(
  args: AdminListParams,
  config: AdminListConfig
): ParsedListQuery {
  const { page, limit, search, sortBy, sortDir, columnFilters = {} } = args;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (search && config.searchColumns) {
    for (const col of config.searchColumns) {
      conditions.push(ilike(col, `%${search}%`));
    }
  }

  for (const [col, val] of Object.entries(columnFilters)) {
    const columnRef = config.filterableColumns?.[col];
    if (columnRef && val) {
      conditions.push(ilike(columnRef, `%${val}%`));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn =
    config.sortableColumns[sortBy || ""] ||
    config.sortableColumns[config.defaultSortBy || "createdAt"];
  const orderDir = sortDir === "asc" ? asc : desc;
  const orderBy = sortColumn
    ? orderDir(sortColumn)
    : desc(config.sortableColumns[config.defaultSortBy || "createdAt"]);

  return { offset, whereClause, orderBy };
}
