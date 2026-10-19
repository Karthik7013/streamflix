import { describe, expect, it } from "vitest";
import {
  ASK_SUGGESTION_LIMIT,
  buildAskSuggestions,
  type AskSuggestionsMovie,
} from "@/app/(main)/movies/[slug]/ask-about-movie-suggestions";

const base: AskSuggestionsMovie = {
  title: "Arrival",
  tags: [{ name: "Sci-Fi" }],
  credits: { cast: [{ id: 1 }] },
  related: [{ id: 2 }],
  durationSeconds: 6960,
  originalLanguage: "en",
};

describe("buildAskSuggestions", () => {
  it("always offers a plot question", () => {
    const suggestions = buildAskSuggestions(base, 0);

    expect(suggestions[0]).toBe("What's Arrival about?");
  });

  it("includes cast, tag, similar and duration questions when the data exists", () => {
    const suggestions = buildAskSuggestions(base, 0);

    expect(suggestions).toContain("Who stars in Arrival?");
    expect(suggestions).toContain("Is Arrival worth watching if I like Sci-Fi?");
    expect(suggestions).toContain("What else is like Arrival?");
  });

  it("adds the reviews question only when there are reviews", () => {
    const withReviews = buildAskSuggestions(base, 12);
    const withoutReviews = buildAskSuggestions(base, 0);

    expect(withReviews).toContain("What are viewers saying about Arrival?");
    expect(withoutReviews).not.toContain("What are viewers saying about Arrival?");
  });

  it("skips questions the movie cannot answer", () => {
    const suggestions = buildAskSuggestions(
      {
        title: "Untitled",
        tags: [],
        credits: { cast: [] },
        related: [],
        durationSeconds: null,
        originalLanguage: null,
      },
      0
    );

    expect(suggestions).toEqual(["What's Untitled about?"]);
  });

  it("never returns more than the limit", () => {
    const suggestions = buildAskSuggestions(base, 5);

    expect(suggestions.length).toBeLessThanOrEqual(ASK_SUGGESTION_LIMIT);
  });

  it("does not repeat a question", () => {
    const suggestions = buildAskSuggestions(base, 3);

    expect(new Set(suggestions).size).toBe(suggestions.length);
  });
});
