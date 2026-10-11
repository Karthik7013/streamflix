import { describe, it, expect, vi, afterEach } from "vitest";
import { adminApi } from "@/lib/api-client/admin";
import type { Movie } from "@/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

const movie: Movie = {
  id: 1,
  title: "t",
  slug: "s",
  description: null,
  videoUrl: null,
  thumbnailUrl: null,
  backdropUrl: null,
  trailerUrl: null,
  published: false,
  durationSeconds: null,
  releaseDate: null,
  tmdbId: null,
  originalLanguage: null,
  tags: [],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

function stubFetch(json: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => json,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("adminApi.movies", () => {
  it("creates a movie via POST /api/admin/movies", async () => {
    const fetchMock = stubFetch({ data: movie });

    const result = await adminApi.movies.create({ title: "t", slug: "s" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/admin/movies");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toMatchObject({ title: "t", slug: "s" });
    expect(result).toEqual({ data: movie });
  });

  it("updates a movie via PUT /api/admin/movies/:id", async () => {
    const fetchMock = stubFetch({ data: movie });

    const result = await adminApi.movies.update(7, { title: "new" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/admin/movies/7");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body as string)).toMatchObject({ title: "new" });
    expect(result).toEqual({ data: movie });
  });
});