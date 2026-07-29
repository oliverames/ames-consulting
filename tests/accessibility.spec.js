import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/", "/testimonials/", "/work/", "/work/eastrise-photography/", "/work/eastrise-writing/", "/work/wheels-for-warmth/", "/work/taylor-hoar-racing/", "/work/member-banking-stories/", "/work/credit-union-websites/", "/work/community-photography/", "/work/corporate-cup-2026/", "/work/girls-on-the-run-2026/", "/work/eastrise-launch-campaign/", "/work/portraits-and-people/", "/work/flight-paths/", "/work/beta-technologies/", "/work/vtdigger-membership/", "/work/fairbanks-planetarium/", "/work/live-broadcasts/", "/work/green-mountain-community-fitness/", "/work/sweat-heart-throwdown/", "/work/bike-fitting/", "/services/strategy-and-content/", "/services/photography-and-video/", "/services/practical-technology/", "/blog/", "/about/", "/contact/", "/missing-page/"]) {
  test(`no critical accessibility issues on ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).exclude(".video-embed").analyze();
    const critical = results.violations.filter((violation) => violation.impact === "critical");

    expect(critical, `Critical accessibility issues found on ${route}`).toEqual([]);
  });
}
