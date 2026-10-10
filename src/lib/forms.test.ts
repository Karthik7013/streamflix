import { describe, it, expect } from "vitest";
import { getFriendlyError, CHAT_SUGGESTIONS } from "@/app/(main)/ai/chat-errors";
import { toMovieFormData } from "@/lib/movie-form";
import type { Movie } from "@/types";

describe("getFriendlyError", () => {
  it("maps rate limits, overloads, and auth failures to friendly copy", () => {
    expect(getFriendlyError(new Error("429 Too Many Requests"))).toMatch(/too many requests/i);
    expect(getFriendlyError(new Error("Service 503 overloaded"))).toMatch(/overloaded/i);
    expect(getFriendlyError(new Error("Invalid api key"))).toMatch(/api key/i);
  });

  it("passes unknown errors through", () => {
    expect(getFriendlyError(new Error("Something odd"))).toBe("Something odd");
  });

  it("ships a non-empty suggestion list", () => {
    expect(CHAT_SUGGESTIONS.length).toBeGreaterThan(0);
  });
});

const movie: Movie = {
  id: 1,
  title: "Dune",
  slug: "dune",
  description: null,
  videoUrl: null,
  thumbnailUrl: null,
  backdropUrl: null,
  trailerUrl: null,
  published: true,
  durationSeconds: 9300,
  releaseDate: "2021-10-22",
  tmdbId: 438631,
  originalLanguage: "en",
  tags: [{ id: 3, name: "Sci-Fi", slug: "sci-fi" }],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-02",
};

describe("toMovieFormData", () => {
  it("maps nulls to form-safe empty values", () => {
    expect(toMovieFormData(movie)).toEqual({
      title: "Dune",
      slug: "dune",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      backdropUrl: "",
      trailerUrl: "",
      durationSeconds: "9300",
      releaseDate: "2021-10-22",
      originalLanguage: "en",
      tagIds: [3],
      tmdbId: 438631,
      published: true,
    });
  });
});
