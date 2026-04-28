import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "/",
  "/blog/",
  "/work/",
  "/work/financial-wellness-library/",
  "/photography/",
  "/photography/lab-open-house-2026/",
  "/contact/",
  "/likes/",
  "/colophon/",
];

for (const route of routes) {
  test(`no critical a11y issues on ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === "critical");

    expect(critical, `Critical accessibility issues found on ${route}`).toEqual([]);
  });
}
