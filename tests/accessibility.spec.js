import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of [
  "/",
  "/testimonials/",
  "/work/",
  "/work/eastrise/",
  "/work/blue-cross-vermont/",
  "/work/connecticut-college/",
  "/work/stowe-ski-instruction/",
  "/work/eastrise-photography/",
  "/work/eastrise-social/",
  "/work/eastrise-writing/",
  "/work/wheels-for-warmth/",
  "/work/taylor-hoar-racing/",
  "/work/member-banking-stories/",
  "/work/credit-union-websites/",
  "/work/vsecu-website/",
  "/work/eastrise-website/",
  "/work/community-photography/",
  "/work/senior-games-press-event-2026/",
  "/work/arrayrx-press-conference-2026/",
  "/work/walk-at-lunch-and-green-up-2026/",
  "/work/be-well-at-work-2026/",
  "/work/corporate-cup-2026/",
  "/work/girls-on-the-run-2026/",
  "/work/eastrise-launch-campaign/",
  "/work/giron-family-fall-2025/",
  "/work/vermont-foodbank-volunteer-day-2026/",
  "/work/beta-andrew/",
  "/work/beta-emma/",
  "/work/beta-ethan/",
  "/work/portraits-and-people/",
  "/work/eastrise-portraits/",
  "/work/blue-cross-portraits/",
  "/work/flight-paths/",
  "/work/beta-technologies/",
  "/work/vtdigger-membership/",
  "/work/fairbanks-planetarium/",
  "/work/live-broadcasts/",
  "/work/green-mountain-community-fitness/",
  "/work/sweat-heart-throwdown/",
  "/work/bike-fitting/",
  "/work/ping-warden/",
  "/work/apple-core/",
  "/work/bridgeport/",
  "/work/meta-mcp-server/",
  "/work/ynab-mcp-server/",
  "/work/skylight-bridge/",
  "/services/strategy-and-content/",
  "/services/photography-and-video/",
  "/services/practical-technology/",
  "/blog/",
  "/blog/archive/",
  "/blog/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids/",
  "/about/",
  "/contact/",
  // python http.server has no custom-404 support, so audit the 404 document
  // directly rather than a missing route (which would serve Python's stub).
  "/404.html",
]) {
  test(`no critical accessibility issues on ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .exclude(".video-embed")
      .analyze();
    const critical = results.violations.filter(
      (violation) => violation.impact === "critical",
    );

    expect(critical, `Critical accessibility issues found on ${route}`).toEqual(
      [],
    );
  });
}

test("inbound project prompt has no critical accessibility issues", async ({ page }) => {
  await page.goto("/work/giron-family-fall-2025/");
  const launcher = page.getByRole("button", { name: "Start a project" });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.4));
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page }).include("#inbound-prompt").analyze();
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  );
  expect(critical).toEqual([]);
});
