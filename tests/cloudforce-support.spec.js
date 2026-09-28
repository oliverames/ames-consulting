import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [route, title] of [["/cloudforce/", "CloudForce Support"], ["/cloudforce/privacy/", "CloudForce Privacy Policy"]]) {
  for (const width of [375, 440, 1280]) {
    for (const colorScheme of ["light", "dark"]) {
      test(`${route} remains readable at ${width}px in ${colorScheme} mode`, async ({ page }) => {
        await page.setViewportSize({ width, height: 956 });
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        const response = await page.goto(route);
        expect(response.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
        expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
        const article = await page.locator("article").boundingBox();
        for (const section of await page.locator("article section").all()) {
          const bounds = await section.boundingBox();
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(article.x + article.width + 1);
        }
        const results = await new AxeBuilder({ page }).include("main").analyze();
        expect(results.violations.filter(({ impact }) => ["moderate", "serious", "critical"].includes(impact))).toEqual([]);
      });
    }
  }
}

test("CloudForce support, privacy, and existing contact remain connected", async ({ page }) => {
  await page.goto("/cloudforce/");
  await page.getByRole("navigation", { name: "CloudForce", exact: true }).getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveURL(/\/cloudforce\/privacy\/$/);
  await expect(page.locator("main")).toContainText("Effective September 28, 2026.");
  await expect(page.locator("main")).toContainText("CloudForce uses Sentry for automatic technical diagnostics.");
  await expect(page.locator("main")).toContainText("You can turn it off in Settings > Diagnostics.");
  await expect(page.locator("main")).toContainText("These pages are hosted on Oliver Ames’s website, which uses Google Analytics.");
  await page.getByRole("navigation", { name: "CloudForce", exact: true }).getByRole("link", { name: "Support", exact: true }).click();
  await expect(page).toHaveURL(/\/cloudforce\/$/);
  await page.getByRole("navigation", { name: "CloudForce", exact: true }).getByRole("link", { name: "Contact Oliver", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator("main a[href='mailto:oliver@ames.consulting']").first()).toBeVisible();
});
