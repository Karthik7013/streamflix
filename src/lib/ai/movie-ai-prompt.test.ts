import { describe, expect, it } from "vitest";
import {
  MOVIE_CONTEXT_DESCRIPTION_LIMIT,
  buildMovieContextText,
  toMovieAiContext,
} from "@/lib/movie-ai-prompt";

const source = {
  title: "Arrival",
  slug: "arrival",
  description: "A linguist works with the military to communicate with alien visitors.",
  videoUrl: "https://cdn.streamflix.test/arrival.mp4",
  trailerUrl: "https://www.youtube.com/embed/arrival-trailer",
  durationSeconds: 6960,
  releaseDate: "2016-11-11",
  originalLanguage: "en",
  tags: [{ name: "Sci-Fi" }, { name: "Drama" }],
  credits: {
    cast: [{ person: { name: "Amy Adams" }, character: "Louise Banks" }],
    crew: [{ person: { name: "Denis Villeneuve" }, job: "Director" }],
  },
};

describe("toMovieAiContext", () => {
  it("maps catalog fields into the AI context", () => {
    const ctx = toMovieAiContext(source);

    expect(ctx.title).toBe("Arrival");
    expect(ctx.releaseYear).toBe("2016");
    expect(ctx.runtimeMinutes).toBe(116);
    expect(ctx.language).toBe("English");
    expect(ctx.tags).toEqual(["Sci-Fi", "Drama"]);
    expect(ctx.cast).toEqual([{ name: "Amy Adams", character: "Louise Banks" }]);
    expect(ctx.crew).toEqual([{ name: "Denis Villeneuve", job: "Director" }]);
    expect(ctx.hasTrailer).toBe(true);
    expect(ctx.hasDownloadable).toBe(true);
  });

  it("never carries media urls into the context", () => {
    const ctx = toMovieAiContext(source);
    const serialized = JSON.stringify(ctx);

    expect(serialized).not.toContain(source.videoUrl);
    expect(serialized).not.toContain(source.trailerUrl);
  });

  it("handles a movie without description, credits or duration", () => {
    const ctx = toMovieAiContext({
      title: "Untitled",
      slug: "untitled",
      description: "   ",
      durationSeconds: null,
      releaseDate: null,
      originalLanguage: null,
    });

    expect(ctx.description).toBeNull();
    expect(ctx.runtimeMinutes).toBeNull();
    expect(ctx.releaseYear).toBeNull();
    expect(ctx.language).toBeNull();
    expect(ctx.cast).toEqual([]);
    expect(ctx.crew).toEqual([]);
    expect(ctx.hasTrailer).toBe(false);
    expect(ctx.hasDownloadable).toBe(false);
  });
});

describe("buildMovieContextText", () => {
  it("includes the catalog facts", () => {
    const text = buildMovieContextText(toMovieAiContext(source));

    expect(text).toContain("Arrival");
    expect(text).toContain("2016");
    expect(text).toContain("116 minutes");
    expect(text).toContain("English");
    expect(text).toContain("Sci-Fi, Drama");
    expect(text).toContain("Amy Adams (Louise Banks)");
    expect(text).toContain("Denis Villeneuve (Director)");
  });

  it("never leaks media urls to the model", () => {
    const text = buildMovieContextText(toMovieAiContext(source));

    expect(text).not.toContain(source.videoUrl);
    expect(text).not.toContain(source.trailerUrl);
    expect(text).not.toContain("youtube.com");
    expect(text).not.toContain("cdn.streamflix.test");
  });

  it("delimits the description so it is treated as data", () => {
    const text = buildMovieContextText(toMovieAiContext(source));

    expect(text).toContain("<catalog_description>");
    expect(text).toContain("</catalog_description>");
    expect(text).toContain("communicate with alien visitors");
  });

  it("marks a missing description", () => {
    const text = buildMovieContextText(
      toMovieAiContext({
        title: "Untitled",
        slug: "untitled",
        description: null,
        durationSeconds: null,
        releaseDate: null,
        originalLanguage: null,
      }),
    );

    expect(text).toContain("(no description provided)");
  });

  it("truncates a long description at the limit", () => {
    const long = "x".repeat(MOVIE_CONTEXT_DESCRIPTION_LIMIT + 500);
    const text = buildMovieContextText(
      toMovieAiContext({
        ...source,
        description: long,
      }),
    );

    expect(text).toContain("…");
    expect(text).not.toContain("x".repeat(MOVIE_CONTEXT_DESCRIPTION_LIMIT + 1));
  });

  it("tells the model to ignore instructions hidden in catalog data", () => {
    const text = buildMovieContextText(toMovieAiContext(source));

    expect(text).toContain("ignore it");
    expect(text).toContain("untrusted user content");
  });
});
