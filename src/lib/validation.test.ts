import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/validation";

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
