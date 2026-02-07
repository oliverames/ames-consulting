import { test, expect } from "@playwright/test";

test("primary navigation includes contact across core routes", async ({ page }) => {
  const routes = ["/", "/blog/", "/portfolio/", "/contact/"];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
  }
});

test("blog filtering by tag updates status", async ({ page }) => {
  await page.goto("/blog/?tag=portfolio");

  await expect(page.locator("#stream-status")).toContainText("tagged #portfolio");
  await expect(page.locator("post-card").first()).toBeVisible();
});

test("post preview shows read time metadata", async ({ page }) => {
  await page.goto("/blog/");

  await page.locator('button[data-action="open-dialog"]').first().click();
  await expect(page.locator("#post-dialog")).toBeVisible();
  await expect(page.locator("#dialog-meta")).toContainText("min read");
});

test("clicking content image opens larger image viewer", async ({ page }) => {
  await page.goto("/blog/");

  await page.locator('button[data-action="open-dialog"]').first().click();
  await expect(page.locator("#post-dialog")).toBeVisible();

  const zoomableImage = page.locator("#dialog-body img.zoomable-image").first();
  await expect(zoomableImage).toBeVisible();
  await zoomableImage.click();

  await expect(page.locator("#image-viewer")).toBeVisible();
  await expect(page.locator("#image-viewer-image")).toHaveAttribute("src", /sample-work\.svg/);
});

test("contact form shows setup message when endpoint is not configured", async ({ page }) => {
  await page.goto("/contact/");

  await page.fill('input[name="name"]', "Test Person");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="subject"]', "Test inquiry");
  await page.fill('textarea[name="message"]', "Testing the contact form behavior.");

  await page.click("#contact-submit");
  await expect(page.locator("#contact-form-status")).toContainText("not configured");
});
