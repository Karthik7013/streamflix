import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query-keys";

describe("admin query-key factories", () => {
  it("builds parameterized list keys with stable base values", () => {
    expect(queryKeys.adminTags(1, "q", "name", "asc")).toEqual([
      "admin-tags",
      1,
      "q",
      "name",
      "asc",
    ]);
    expect(queryKeys.adminUsers(2, "a@x.com")).toEqual([
      "admin-users",
      2,
      "a@x.com",
    ]);
    expect(queryKeys.adminMovies(1, "", undefined, "desc", "")).toEqual([
      "admin-movies",
      1,
      "",
      undefined,
      "desc",
      "",
    ]);
  });

  it("returns the bare base key when called with no params", () => {
    expect(queryKeys.adminTags()).toEqual(["admin-tags"]);
    expect(queryKeys.adminRequests()).toEqual(["admin-requests"]);
    expect(queryKeys.adminReports()).toEqual(["admin-reports"]);
    expect(queryKeys.adminFeatured()).toEqual(["admin-featured"]);
  });
});
