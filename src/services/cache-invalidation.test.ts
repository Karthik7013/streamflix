import { describe, it, expect, vi, beforeEach } from "vitest";

function makeChain(): unknown {
  const chain = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve([]);
      }
      return () => chain;
    },
  });
  return chain;
}

vi.mock("@/db", () => ({
  db: {
    select: () => makeChain(),
    insert: () => makeChain(),
    delete: () => makeChain(),
    transaction: async (cb: (tx: unknown) => unknown) => cb(makeChain()),
  },
}));

vi.mock("@/lib/cache", () => ({
  cacheGetOrSet: async (_key: string, _ttl: number, fetch: () => Promise<unknown>) => fetch(),
  CACHE_TTL: { FAST: 120, DEFAULT: 300, SLOW: 600 },
  invalidateCache: vi.fn(),
  cacheDelByPrefix: vi.fn(),
}));

vi.mock("@/lib/rag", () => ({
  indexMovieById: vi.fn(),
  deleteMovieVector: vi.fn(),
}));

import { invalidateCache, cacheDelByPrefix } from "@/lib/cache";
import { addToWatchlist, removeFromWatchlist } from "@/services/watchlist";
import { createTag } from "@/services/tags";
import { createMovie } from "@/services/movies-admin";

const inv = vi.mocked(invalidateCache);
const del = vi.mocked(cacheDelByPrefix);

beforeEach(() => {
  inv.mockClear();
  del.mockClear();
});

describe("cache invalidation scopes", () => {
  it("scopes watchlist busts to the acting user", async () => {
    await addToWatchlist(1, "u1");
    await removeFromWatchlist(1, "u1");

    expect(inv).not.toHaveBeenCalledWith("watchlist");
    expect(del).toHaveBeenCalledWith("watchlist:user:u1");
    expect(del).toHaveBeenCalledTimes(2);
  });

  it("busts tag, tag-movies, and home caches on tag writes", async () => {
    await createTag("action");

    expect(inv).toHaveBeenCalledWith("tags");
    expect(inv).toHaveBeenCalledWith("tag-movies");
    expect(inv).toHaveBeenCalledWith("home");
  });

  it("busts tag-derived caches on movie writes", async () => {
    await createMovie({ title: "t", slug: "s" });

    await vi.waitFor(() => {
      expect(inv).toHaveBeenCalledWith("movies-list");
      expect(inv).toHaveBeenCalledWith("tags");
      expect(inv).toHaveBeenCalledWith("tag-movies");
    });
  });
});
