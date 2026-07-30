import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of [
  "/",
  "/testimonials/",
  "/work/",
  "/work/eastrise-photography/",
  "/work/eastrise-social/",
  "/work/eastrise-writing/",
  "/work/wheels-for-warmth/",
  "/work/taylor-hoar-racing/",
  "/work/member-banking-stories/",
  "/work/credit-union-websites/",
  "/work/community-photography/",
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
  "/blog/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids/",
  "/about/",
  "/contact/",
  "/missing-page/",
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
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.25));
  await page.getByRole("button", { name: "Start a project" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const results = await new AxeBuilder({ page }).include("#inbound-prompt").analyze();
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  );
  expect(critical).toEqual([]);
});
