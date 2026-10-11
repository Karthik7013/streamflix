import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: () => {
      throw new Error("db down");
    },
  },
}));

import { paginatedQuery } from "@/lib/pagination";
import { movies } from "@/db/schema";

describe("paginatedQuery DB failure", () => {
  it("throws instead of resolving to an empty list", async () => {
    await expect(
      paginatedQuery(
        { page: 1, limit: 10 },
        {
          sortableColumns: {
            id: movies.id,
            title: movies.title,
            createdAt: movies.createdAt,
          },
          searchColumns: [movies.title],
          defaultSortBy: "title",
        },
        {
          select: {
            id: movies.id,
            title: movies.title,
            slug: movies.slug,
            thumbnailUrl: movies.thumbnailUrl,
          },
          table: movies,
          bodyId: movies.id,
          conditions: [],
          errorContext: "pagination-test",
        }
      )
    ).rejects.toThrow();
  });
});
