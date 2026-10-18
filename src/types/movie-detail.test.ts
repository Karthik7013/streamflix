import { describe, it, expect } from "vitest";
import type { MovieDetail } from "@/types";

const detail: MovieDetail = {
  id: 1,
  title: "t",
  slug: "s",
  description: null,
  videoUrl: null,
  thumbnailUrl: null,
  backdropUrl: null,
  trailerUrl: null,
  published: true,
  durationSeconds: null,
  releaseDate: null,
  tmdbId: null,
  originalLanguage: null,
  tags: [],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  related: [{ id: 9, title: "r", slug: "r", thumbnailUrl: null }],
  credits: { cast: [], crew: [] },
};

describe("MovieDetail", () => {
  it("carries the base movie fields plus related titles", () => {
    expect(detail.title).toBe("t");
    expect(detail.related).toHaveLength(1);
    expect(detail.related[0].slug).toBe("r");
  });
});
