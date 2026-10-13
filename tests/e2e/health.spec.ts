import { test, expect } from "@playwright/test";

test("health endpoint reports status", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(["ok", "degraded"]).toContain(body.status);
});
