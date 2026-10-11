import { describe, it, expect } from "vitest";
import { STALE } from "@/lib/stale-times";

describe("STALE tiers", () => {
  it("exposes a single 30-minute tier for reference data", () => {
    expect(STALE.THIRTY_MIN).toBe(30 * 60 * 1000);
    expect("LONG" in STALE).toBe(false);
  });

  it("orders tiers from fastest to slowest", () => {
    expect(STALE.NEVER).toBeLessThan(STALE.FAST);
    expect(STALE.FAST).toBeLessThan(STALE.DEFAULT);
    expect(STALE.DEFAULT).toBeLessThan(STALE.THIRTY_MIN);
  });
});
