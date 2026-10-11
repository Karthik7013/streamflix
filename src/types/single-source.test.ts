import { describe, it, expect, expectTypeOf } from "vitest";
import type { MostFavoritedMovie, TmdbImportResult, RecentSignup } from "@/types";

describe("shared admin types single-source", () => {
  it("MostFavoritedMovie matches DB shape with favCount", () => {
    expectTypeOf<MostFavoritedMovie>().toHaveProperty("favCount");
    expectTypeOf<MostFavoritedMovie>().not.toHaveProperty("favoriteCount");

    const row: MostFavoritedMovie = {
      id: 1,
      title: "t",
      slug: "s",
      thumbnailUrl: "u",
      favCount: 3,
    };
    expect(row.favCount).toBe(3);
  });

  it("exposes TmdbImportResult from @/types", () => {
    const result: TmdbImportResult = {
      title: "t",
      overview: "o",
      releaseDate: "2024-01-01",
      originalLanguage: "en",
      tmdbId: 1,
      durationSeconds: null,
      thumbnailUrl: null,
      backdropUrl: null,
      trailerUrl: null,
    };
    expect(result.tmdbId).toBe(1);
  });

  it("exposes RecentSignup from @/types", () => {
    const user: RecentSignup = {
      id: "1",
      name: "n",
      email: "e@x.com",
      emailVerified: true,
      createdAt: "2024-01-01",
    };
    expect(user.id).toBe("1");
  });
});
