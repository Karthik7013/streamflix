import { describe, it, expect } from "vitest";
import { safeParseInt, parseIdParam, parseAdminListParams } from "@/lib/api-utils";

describe("safeParseInt", () => {
  it("parses valid integers", () => {
    expect(safeParseInt("42", 0)).toBe(42);
  });

  it("returns the fallback for missing or invalid input", () => {
    expect(safeParseInt(null, 7)).toBe(7);
    expect(safeParseInt(undefined, 7)).toBe(7);
    expect(safeParseInt("abc", 7)).toBe(7);
  });
});

describe("parseIdParam", () => {
  it("accepts positive integers", () => {
    expect(parseIdParam("12")).toBe(12);
  });

  it("rejects missing, non-numeric, zero, and negative ids", () => {
    expect(parseIdParam(null)).toBeNull();
    expect(parseIdParam(undefined)).toBeNull();
    expect(parseIdParam("abc")).toBeNull();
    expect(parseIdParam("0")).toBeNull();
    expect(parseIdParam("-3")).toBeNull();
  });
});

describe("parseAdminListParams", () => {
  it("parses pagination and column filters", () => {
    const params = new URLSearchParams("page=2&limit=10&search=foo&published=true");
    const parsed = parseAdminListParams(params);
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.search).toBe("foo");
    expect(parsed.columnFilters).toEqual({ published: "true" });
  });

  it("ignores cursor params (admin lists are page-based)", () => {
    const parsed = parseAdminListParams(new URLSearchParams("cursor=abc&page=3"));
    expect("cursor" in parsed).toBe(false);
    expect(parsed.page).toBe(3);
  });
});
