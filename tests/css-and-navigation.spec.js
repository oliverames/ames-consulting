import { test, expect } from "@playwright/test";

test("brand stylesheet and primary navigation are active", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Barlow Condensed");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Work", exact: true })).toHaveAttribute("href", "./work/");
});

test("all public content routes load", async ({ request }) => {
  for (const route of ["/", "/work/", "/work/eastrise-writing/", "/work/wheels-for-warmth/", "/work/taylor-hoar-racing/", "/work/member-banking-stories/", "/work/credit-union-websites/", "/work/community-photography/", "/work/corporate-cup-2026/", "/work/girls-on-the-run-2026/", "/work/eastrise-launch-campaign/", "/work/portraits-and-people/", "/work/flight-paths/", "/services/strategy-and-content/", "/services/photography-and-video/", "/services/practical-technology/", "/blog/", "/about/", "/contact/"]) {
    const response = await request.get(route);
    expect(response.status(), `${route} should be published`).toBe(200);
  }
});

test("campaign pages use local images and YouTube embeds", async ({ page }) => {
  await page.goto("/work/member-banking-stories/");
  await expect(page.locator("main img")).toHaveCount(1);
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(3);
});
