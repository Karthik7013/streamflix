import { describe, expect, it } from "vitest";
import {
  adminChatLimitSchema,
  adminChatResolveReportSchema,
  adminChatAssignTagsSchema,
} from "@/lib/schemas";

describe("adminChatLimitSchema", () => {
  it("defaults limit to 10", () => {
    expect(adminChatLimitSchema.parse({}).limit).toBe(10);
  });

  it("rejects limit above 25", () => {
    expect(adminChatLimitSchema.safeParse({ limit: 26 }).success).toBe(false);
  });
});

describe("adminChatResolveReportSchema", () => {
  it("accepts a valid resolve payload", () => {
    expect(
      adminChatResolveReportSchema.parse({ id: 3, status: "resolved" })
    ).toEqual({ id: 3, status: "resolved" });
  });

  it("rejects an unknown status", () => {
    expect(
      adminChatResolveReportSchema.safeParse({ id: 3, status: "deleted" }).success
    ).toBe(false);
  });
});

describe("adminChatAssignTagsSchema", () => {
  it("rejects an empty tag list", () => {
    expect(
      adminChatAssignTagsSchema.safeParse({ movieId: 1, tagIds: [] }).success
    ).toBe(false);
  });
});
