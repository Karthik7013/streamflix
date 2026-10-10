import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

describe("cursor codec", () => {
  it("round-trips payloads", () => {
    const payload = { t: "Dune: Part Two", id: 42 };
    expect(decodeCursor<typeof payload>(encodeCursor(payload))).toEqual(payload);
  });

  it("returns undefined for missing or garbage input", () => {
    expect(decodeCursor(undefined)).toBeUndefined();
    expect(decodeCursor(null)).toBeUndefined();
    expect(decodeCursor("")).toBeUndefined();
    expect(decodeCursor("!!!not-base64!!!")).toBeUndefined();
  });

  it("produces URL-safe strings", () => {
    const encoded = encodeCursor({ c: "2024-01-01T00:00:00.000Z", id: 7 });
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
