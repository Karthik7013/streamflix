import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { validateBody } from "@/lib/api-errors";
import { api, ApiError } from "@/lib/api-client/client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validation error details survive server to client", () => {
  it("ApiError carries field-level details from a validateBody failure", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const parsed = validateBody(schema, { name: "" });
    expect("error" in parsed).toBe(true);
    if (!("error" in parsed)) throw new Error("expected validation failure");
    const body = await parsed.error.json();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(body),
      }))
    );

    const thrown: unknown = await api("/api/admin/tags", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    }).catch((err: unknown) => err);
    expect(thrown).toBeInstanceOf(ApiError);
    const apiErr = thrown as ApiError;
    expect(apiErr.code).toBe("VALIDATION_ERROR");
    expect(apiErr.details).toBeDefined();
  });
});