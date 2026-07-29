import { test, expect } from "@playwright/test";

test("brand stylesheet and primary navigation are active", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  expect(
    await heading.evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain("Barlow Condensed");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Work", exact: true }),
  ).toHaveAttribute("href", "./work/");
});

test("all public content routes load", async ({ request }) => {
  for (const route of [
    "/",
    "/work/",
    "/work/eastrise-writing/",
    "/work/wheels-for-warmth/",
    "/work/taylor-hoar-racing/",
    "/work/member-banking-stories/",
    "/work/credit-union-websites/",
    "/work/community-photography/",
    "/work/corporate-cup-2026/",
    "/work/girls-on-the-run-2026/",
    "/work/eastrise-launch-campaign/",
    "/work/portraits-and-people/",
    "/work/flight-paths/",
    "/services/strategy-and-content/",
    "/services/photography-and-video/",
    "/services/practical-technology/",
    "/blog/",
    "/blog/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids/",
    "/about/",
    "/contact/",
  ]) {
    const response = await request.get(route);
    expect(response.status(), `${route} should be published`).toBe(200);
  }
});

test("small-screen navigation and page headers keep deliberate spacing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/");
  const layout = await page.evaluate(() => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const nav = document.querySelector(".site-nav");
    const pageHeader = document.querySelector(".page-header");
    return {
      headerHeight: header.height,
      navWrap: getComputedStyle(nav).flexWrap,
      pageHeaderPaddingTop: Number.parseFloat(getComputedStyle(pageHeader).paddingTop),
      pageHeaderGap: Number.parseFloat(getComputedStyle(pageHeader).rowGap),
    };
  });
  expect(layout.headerHeight).toBeLessThan(130);
  expect(layout.navWrap).toBe("nowrap");
  expect(layout.pageHeaderPaddingTop).toBeGreaterThanOrEqual(48);
  expect(layout.pageHeaderGap).toBeGreaterThanOrEqual(10);

  await page.goto("/work/portraits-and-people/");
  const caseHeroGap = await page
    .locator(".case-hero")
    .evaluate((hero) => Number.parseFloat(getComputedStyle(hero).rowGap));
  expect(caseHeroGap).toBeGreaterThanOrEqual(10);

  await page.goto("/contact/");
  const contactSpacing = await page.evaluate(() => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const hero = document.querySelector(".contact-hero").getBoundingClientRect();
    return hero.top - header.bottom;
  });
  expect(contactSpacing).toBeGreaterThanOrEqual(18);
});

test("campaign pages use local images and YouTube embeds", async ({ page }) => {
  await page.goto("/work/member-banking-stories/");
  await expect(page.locator("main img")).toHaveCount(1);
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(
    11,
  );
});
