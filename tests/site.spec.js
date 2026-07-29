import { test, expect } from "@playwright/test";

test("public site is a clean content shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("ames.consulting");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ames.consulting");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("nav, article, section, form")).toHaveCount(0);
});

test("removed content routes return not found", async ({ request }) => {
  const response = await request.get("/work/");

  expect(response.status()).toBe(404);
});
