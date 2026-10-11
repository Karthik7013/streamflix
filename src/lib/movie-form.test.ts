import { describe, it, expect } from "vitest";
import { toCreateMovieApiData } from "@/lib/movie-form";
import type { MovieFormData } from "@/lib/schemas";

const base: MovieFormData = {
  title: "t",
  slug: "s",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  backdropUrl: "",
  trailerUrl: "",
  durationSeconds: "",
  releaseDate: "",
  tagIds: [],
  originalLanguage: "",
  tmdbId: undefined,
  published: false,
};

describe("toCreateMovieApiData", () => {
  it("converts numeric duration strings to seconds", () => {
    expect(toCreateMovieApiData({ ...base, durationSeconds: "90" }).durationSeconds).toBe(90);
  });

  it("maps blank or invalid durations to null", () => {
    expect(toCreateMovieApiData({ ...base, durationSeconds: "" }).durationSeconds).toBeNull();
    expect(toCreateMovieApiData({ ...base, durationSeconds: "abc" }).durationSeconds).toBeNull();
  });

  it("passes the remaining fields through untouched", () => {
    expect(toCreateMovieApiData({ ...base, title: "new", tagIds: [1, 2] })).toMatchObject({
      title: "new",
      slug: "s",
      tagIds: [1, 2],
    });
  });
});
