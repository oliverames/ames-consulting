import { test, expect } from "@playwright/test";

test("brand stylesheet is loaded and applied", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();

  const styles = await heading.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      family: computed.fontFamily,
      transform: computed.textTransform
    };
  });

  expect(styles.family).toContain("Barlow Condensed");
  expect(styles.transform).toBe("lowercase");
});

test("public shell has no legacy navigation or content links", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("nav, article, section, form, footer")).toHaveCount(0);
  await expect(page.locator("a")).toHaveCount(0);
});

test("former public content routes are gone", async ({ request }) => {
  for (const route of ["/blog/", "/work/", "/photography/", "/contact/"]) {
    const response = await request.get(route);
    expect(response.status(), `${route} should not remain published`).toBe(404);
  }
});
