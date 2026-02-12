import { test, expect } from "@playwright/test";

const LOCAL_CONFIG = JSON.stringify({
  provider: "local",
  jsonFeedUrl: "",
  siteTitle: "ames.consulting",
  siteUrl: "https://ames.consulting",
  siteDescription: "Independent software consulting, writing, and portfolio work by Oliver Ames.",
  authorName: "Oliver Ames",
  locale: "en_US",
  portfolioTag: "portfolio",
  homePreviewLimit: 6
});

function useLocalContent(page) {
  return page.route("**/site.config.json", (route) =>
    route.fulfill({ contentType: "application/json", body: LOCAL_CONFIG })
  );
}

test("primary navigation includes core routes", async ({ page }) => {
  await useLocalContent(page);
  const routes = ["/", "/blog/", "/work/", "/contact/"];

  for (const route of routes) {
    await page.goto(route);
    const nav = page.getByLabel("Primary");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Work" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
  }
});

test("blog filtering by tag updates status", async ({ page }) => {
  await useLocalContent(page);
  await page.goto("/blog/?tag=portfolio");

  await expect(page.locator("#stream-status")).toContainText("tagged #portfolio");
  await expect(page.locator("post-card").first()).toBeVisible();
});

test("static blog post shows read time metadata", async ({ page }) => {
  await useLocalContent(page);
  // Navigate to a generated blog post page
  await page.goto("/blog/spec-first-front-end-planning/");

  // Check for read time in article metadata
  await expect(page.locator("article")).toBeVisible();
  await expect(page.locator("time").first()).toBeVisible();
  await expect(page.locator(".blog-post-meta")).toContainText("min read");
});

test("clicking content image opens larger image viewer", async ({ page }) => {
  await useLocalContent(page);
  // Navigate to a generated blog post page
  await page.goto("/blog/spec-first-front-end-planning/");

  // Find a zoomable image in the blog post content
  const zoomableImage = page.locator(".blog-post-content img.zoomable-image").first();
  await expect(zoomableImage).toBeVisible();
  await zoomableImage.click();

  // Check that image viewer opens
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
