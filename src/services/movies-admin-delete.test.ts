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

const selectRows = [
  { videoUrl: "https://ia/video.mp4", thumbnailUrl: "https://ia/thumb.jpg", backdropUrl: null },
];

vi.mock("@/db", () => ({
  db: {
    select: () => {
      const chain = makeChain();
      void chain;
      return {
        from: () => ({
          where: () => ({
            limit: async () => selectRows,
          }),
        }),
      };
    },
    delete: () => ({
      where: async () => [],
    }),
  },
}));

vi.mock("@/lib/upload-utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/upload-utils")>();
  return {
    ...original,
    deleteFromIA: vi.fn(async (url: string) => {
      if (url.includes("thumb")) throw new Error("storage down");
    }),
  };
});

vi.mock("@/lib/rag", () => ({
  indexMovieById: vi.fn(),
  deleteMovieVector: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { deleteMovie } from "@/services/movies-admin";
import { logger } from "@/lib/logger";

const logError = vi.mocked(logger.error);

beforeEach(() => {
  logError.mockClear();
});

describe("deleteMovie", () => {
  it("logs failed storage deletes but still removes the movie", async () => {
    const result = await deleteMovie(7);

    expect(result).toBe(true);
    expect(logError).toHaveBeenCalledWith(
      "movies-admin",
      "Failed to delete movie asset",
      "https://ia/thumb.jpg",
      expect.any(Error)
    );
  });
});
