import { describe, it, expect, vi, beforeEach } from "vitest";

let queued: unknown[] = [];
let n = 0;

function makeChain(): unknown {
  const chain = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => {
          resolve(queued[Math.min(n++, queued.length - 1)]);
        };
      }
      return () => chain;
    },
  });
  return chain;
}

vi.mock("@/db", () => ({
  db: {
    select: () => makeChain(),
  },
}));

import { paginatedQuery } from "@/lib/paginated-query";
import { movies, movieTags } from "@/db/schema";

const config = {
  sortableColumns: {
    id: movies.id,
    title: movies.title,
    createdAt: movies.createdAt,
  },
  searchColumns: [movies.title],
  defaultSortBy: "title",
};

const select = {
  id: movies.id,
  title: movies.title,
  slug: movies.slug,
  thumbnailUrl: movies.thumbnailUrl,
};

beforeEach(() => {
  n = 0;
});

describe("paginatedQuery branches", () => {
  it("returns data and meta for plain lists", async () => {
    queued = [[{ id: 1 }, { id: 2 }], [{ value: 2 }]];

    const result = await paginatedQuery<{ id: number }>(
      { page: 1, limit: 10 },
      { ...config },
      {
        select,
        table: movies,
        bodyId: movies.id,
        conditions: [],
        errorContext: "pagination-test",
      }
    );

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1, hasMore: false });
  });

  it("returns data and meta for tag-filtered lists", async () => {
    queued = [[{ id: 1 }], [{ value: 1 }]];

    const result = await paginatedQuery<{ id: number }>(
      { page: 1, limit: 10, tagsParam: "3" },
      { ...config },
      {
        select,
        table: movies,
        junction: movieTags,
        junctionFk: movieTags.movieId,
        junctionTagId: movieTags.tagId,
        bodyId: movies.id,
        conditions: [],
        errorContext: "pagination-test",
      }
    );

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false });
  });
});
