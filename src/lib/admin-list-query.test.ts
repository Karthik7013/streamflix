import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { parseAdminListQuery } from "@/lib/pagination";
import { movies } from "@/db/schema";

const config = {
  sortableColumns: {
    id: movies.id,
    title: movies.title,
    createdAt: movies.createdAt,
  },
  searchColumns: [movies.title],
  defaultSortBy: "title",
};

describe("parseAdminListQuery (single home)", () => {
  it("parses page, search, sort, and tag params in one pass", () => {
    const parsed = parseAdminListQuery(
      { page: 2, limit: 10, search: "foo", sortBy: "title", sortDir: "asc", tagsParam: "3" },
      config
    );

    expect(parsed.offset).toBe(10);
    expect(parsed.whereClause).toBeDefined();
    expect(parsed.orderBy).toBeDefined();
    expect(parsed.hasTagFilter).toBe(true);
    expect(parsed.tagIds).toEqual([3]);
  });

  it("treats q as search and leaves tags empty when absent", () => {
    const fromQ = parseAdminListQuery({ page: 1, limit: 10, q: "foo" }, config);
    const fromSearch = parseAdminListQuery({ page: 1, limit: 10, search: "foo" }, config);

    expect(fromQ.offset).toBe(fromSearch.offset);
    expect(fromQ.whereClause).toBeDefined();
    expect(fromQ.hasTagFilter).toBe(false);
    expect(fromQ.tagIds).toEqual([]);
  });
});
