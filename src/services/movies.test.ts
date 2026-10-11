import { describe, it, expect, vi } from "vitest";

const movieRow = { id: 7, title: "t", slug: "s" };
const tagRows = [{ id: 3, name: "action", slug: "action" }];
const relatedRows = [{ id: 9, title: "r", slug: "r", thumbnailUrl: null }];

const resolutions = [[movieRow], tagRows, relatedRows, tagRows, relatedRows];
let n = 0;
const selectSpy = vi.fn();

function makeChain(): unknown {
  const chain = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => {
          resolve(resolutions[Math.min(n++, resolutions.length - 1)]);
        };
      }
      return () => chain;
    },
  });
  return chain;
}

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      selectSpy(...args);
      return makeChain();
    },
  },
}));

import { getMovieBySlug } from "@/services/movies";

describe("getMovieBySlug", () => {
  it("reuses the fetched movie and tags for related instead of re-querying", async () => {
    const result = await getMovieBySlug("s");

    expect(selectSpy).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ ...movieRow, tags: tagRows, related: relatedRows });
  });
});
