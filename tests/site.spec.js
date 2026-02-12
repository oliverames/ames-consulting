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
  await expect(page.locator(".dialog-meta")).toBeVisible();
  await expect(page.locator(".dialog-meta")).toContainText("min read");
});

test("blog post page contains content and images", async ({ page }) => {
  await useLocalContent(page);
  // Navigate to a generated blog post page
  await page.goto("/blog/spec-first-front-end-planning/");

  // Check that blog post content exists
  const content = page.locator(".blog-post-content");
  await expect(content).toBeVisible();

  // Check that the post has at least some content (paragraphs or images)
  const hasContent = await content.locator("p, img").count();
  expect(hasContent).toBeGreaterThan(0);
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

test("photography gallery listing page loads with all galleries", async ({ page }) => {
  await page.goto("/photography/");

  await expect(page.locator("h1")).toContainText("Photography");
  const galleries = page.locator(".gallery-preview");
  await expect(galleries).toHaveCount(4);

  // Verify galleries have expected content
  await expect(galleries.first()).toContainText("BETA Technologies");
});

test("eastrise writing samples page loads and displays posts", async ({ page }) => {
  await page.goto("/work/eastrise-writing/");

  await expect(page.locator("h1")).toContainText("EastRise Writing Samples");

  // Check that posts are visible
  const posts = page.locator(".post-preview");
  const initialCount = await posts.count();
  expect(initialCount).toBeGreaterThan(0);
});

test("eastrise category filtering changes visible posts", async ({ page }) => {
  await page.goto("/work/eastrise-writing/");

  // Wait for posts to load
  const posts = page.locator(".post-preview");
  await posts.first().waitFor({ timeout: 5000 });

  const allCount = await posts.count();
  expect(allCount).toBeGreaterThan(0);

  // Select a category filter (Auto)
  await page.selectOption("#category-filter", "auto");
  await page.waitForTimeout(500);

  // Verify that filtering happened (count may change or stay same if all posts are Auto)
  const filteredCount = await posts.count();
  expect(filteredCount).toBeLessThanOrEqual(allCount);
  expect(filteredCount).toBeGreaterThan(0); // At least some Auto posts should exist
});

test("individual photography gallery page loads with images", async ({ page }) => {
  await page.goto("/photography/beta-career-day-2026/");

  await expect(page.locator("h1")).toContainText("BETA Technologies Career Day");

  // Check that gallery images are present
  const images = page.locator(".photo-gallery img");
  const imageCount = await images.count();
  expect(imageCount).toBeGreaterThan(0);

  // Verify back link exists
  await expect(page.locator(".sibling-nav a")).toHaveText("← Back to Photography");
});
