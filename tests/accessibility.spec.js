import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/", "/missing-page/"]) {
  test(`no critical accessibility issues on ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === "critical");

    expect(critical, `Critical accessibility issues found on ${route}`).toEqual([]);
  });
}
