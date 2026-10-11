import { describe, it, expect } from "vitest";
import { languageName } from "@/lib/languages";
import { formatDuration, formatYear, formatMinutes, generateSlug } from "@/lib/format";

describe("languageName", () => {
  it("resolves known codes", () => {
    expect(languageName("en")).toBe("English");
    expect(languageName("te")).toBe("Telugu");
  });

  it("passes unknown codes through and preserves nullish input", () => {
    expect(languageName("xx")).toBe("xx");
    expect(languageName(null)).toBeNull();
    expect(languageName(undefined)).toBeUndefined();
  });
});

describe("format helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(90 * 60)).toBe("1h 30m");
    expect(formatDuration(45 * 60)).toBe("45m");
    expect(formatDuration(null)).toBeNull();
  });

  it("extracts years", () => {
    expect(formatYear("2024-05-01")).toBe("2024");
    expect(formatYear(null)).toBeNull();
  });

  it("converts seconds to minutes", () => {
    expect(formatMinutes(5400)).toBe(90);
    expect(formatMinutes(undefined)).toBeNull();
  });
});

describe("generateSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(generateSlug("The Dark Knight")).toBe("the-dark-knight");
  });

  it("strips diacritics", () => {
    expect(generateSlug("Amélie")).toBe("amelie");
  });

  it("removes unsafe characters and collapses hyphens", () => {
    expect(generateSlug("  Spider-Man: No Way Home!! ")).toBe("spider-man-no-way-home");
  });

  it("returns empty string for blank input", () => {
    expect(generateSlug("")).toBe("");
    expect(generateSlug("!!!")).toBe("");
  });
});
