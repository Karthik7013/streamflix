import { describe, it, expect, vi } from "vitest";

vi.mock("@/services/movies", () => ({
  getMovieBySlug: vi.fn(),
}));

vi.mock("@/app/(main)/watch/[slug]/watch-content", () => ({
  WatchContent: () => null,
}));

import { generateMetadata } from "@/app/(main)/watch/[slug]/page";
import { getMovieBySlug } from "@/services/movies";

const mockedGetBySlug = vi.mocked(getMovieBySlug);

describe("watch page metadata", () => {
  it("uses the movie title so the tab names what is being watched", async () => {
    mockedGetBySlug.mockResolvedValueOnce({
      title: "Agadha",
      slug: "agadha",
      description: "A thriller",
      backdropUrl: null,
      thumbnailUrl: "/thumb.jpg",
    } as never);

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "agadha" }) });

    expect(mockedGetBySlug).toHaveBeenCalledWith("agadha");
    expect(metadata.title).toBe("Agadha");
  });

  it("falls back to a generic title when the movie is missing", async () => {
    mockedGetBySlug.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "nope" }) });

    expect(metadata.title).toBe("Now Watching");
  });
});
