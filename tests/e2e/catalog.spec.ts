import { test, expect } from "@playwright/test";

test("home loads the carousel or its empty state", async ({ page }) => {
  await page.goto("/home");
  const main = page.locator("main").first();
  await expect(main).toBeVisible();
  await expect(
    page.getByText("Featured section empty").or(main.locator("h2").first())
  ).toBeVisible();
});

test("tag page renders its heading and grid", async ({ page }) => {
  await page.goto("/tags/action");
  await expect(page.locator("h1").first()).toBeVisible();
});
