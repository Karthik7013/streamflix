export const CACHE_CONTROL = {
  PUBLIC: "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
  PRIVATE: "private, max-age=120, stale-while-revalidate=600",
} as const;

export function safeParseInt(value: string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function sortDirFromSearchParams(value: string | null): "asc" | "desc" | undefined {
  if (value === "asc" || value === "desc") return value;
  return undefined;
}

const BASE_IGNORED = ["page", "limit", "search", "sortBy", "sortDir"];

function extractColumnFilters(searchParams: URLSearchParams, extraIgnore: string[] = []): Record<string, string> {
  const ignored = new Set([...BASE_IGNORED, ...extraIgnore]);
  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!ignored.has(key) && value) {
      filters[key] = value;
    }
  }
  return filters;
}

function parsePagination(searchParams: URLSearchParams, defaults = { page: "1", limit: "20" }) {
  return {
    page: safeParseInt(searchParams.get("page"), parseInt(defaults.page)),
    limit: safeParseInt(searchParams.get("limit"), parseInt(defaults.limit)),
    search: searchParams.get("search") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    sortDir: sortDirFromSearchParams(searchParams.get("sortDir")),
  };
}

export function parseAdminListParams(searchParams: URLSearchParams, defaults = { page: "1", limit: "20" }, extraIgnore: string[] = []) {
  const pagination = parsePagination(searchParams, defaults);
  return { ...pagination, columnFilters: extractColumnFilters(searchParams, extraIgnore) };
}
