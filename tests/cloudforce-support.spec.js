import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

for (const [route, title] of [["/cloudforce/", "CloudLink for GeForce NOW Support"], ["/cloudforce/privacy/", "CloudLink for GeForce NOW Privacy Policy"]]) {
  for (const width of [375, 440, 1280]) {
    for (const colorScheme of ["light", "dark"]) {
      test(`${route} source migration notice remains readable at ${width}px in ${colorScheme} mode`, async ({ page }, testInfo) => {
        test.skip(Boolean(testInfo.config.metadata?.siteRoot), "Production uses Pages redirects; these notices are source-preview only.");
        await page.setViewportSize({ width, height: 956 });
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        const response = await page.goto(route);
        expect(response.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
        expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
        const article = await page.locator("article").boundingBox();
        expect(article.x + article.width).toBeLessThanOrEqual(width + 1);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
        await expect(page.locator("main")).toContainText("CloudForce is now CloudLink for GeForce NOW.");
        const results = await new AxeBuilder({ page }).include("main").analyze();
        expect(results.violations.filter(({ impact }) => ["moderate", "serious", "critical"].includes(impact))).toEqual([]);
      });
    }
  }
}

test("source migration notices link to CloudLink and preserve the existing contact destination", async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.config.metadata?.siteRoot), "Production uses Pages redirects; these notices are source-preview only.");
  await page.goto("/cloudforce/");
  const navigation = page.getByRole("navigation", { name: "CloudLink", exact: true });
  await expect(navigation.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "https://cloudlink.games/privacy/");
  await expect(navigation.getByRole("link", { name: "Support", exact: true })).toHaveAttribute("href", "https://cloudlink.games/support/");
  await expect(page.getByRole("link", { name: "Read the CloudLink support information", exact: true })).toHaveAttribute("href", "https://cloudlink.games/support/");
  await page.goto("/cloudforce/privacy/");
  await expect(page.getByRole("link", { name: "Read the CloudLink privacy policy", exact: true })).toHaveAttribute("href", "https://cloudlink.games/privacy/");
  await page.getByRole("navigation", { name: "CloudLink", exact: true }).getByRole("link", { name: "Contact Oliver", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator("main a[href='mailto:oliver@ames.consulting']").first()).toBeVisible();
});

test("deployment artifact carries only CloudLink redirects, without duplicate CloudForce policies", async ({}, testInfo) => {
  test.skip(!testInfo.config.metadata?.siteRoot, "This assertion checks the generated publication artifact.");
  const root = join(process.cwd(), testInfo.config.metadata.siteRoot);
  const redirects = await readFile(join(root, "_redirects"), "utf8");
  for (const [source, target] of [
    ["/cloudforce", "https://cloudlink.games/support/"],
    ["/cloudforce/", "https://cloudlink.games/support/"],
    ["/cloudforce/index.html", "https://cloudlink.games/support/"],
    ["/cloudforce/privacy", "https://cloudlink.games/privacy/"],
    ["/cloudforce/privacy/", "https://cloudlink.games/privacy/"],
    ["/cloudforce/privacy/index.html", "https://cloudlink.games/privacy/"],
  ]) expect(redirects.split("\n")).toContain(`${source} ${target} 301`);
  for (const file of ["cloudforce/index.html", "cloudforce/privacy/index.html", "assets/data/cloudforce-pages.json"]) {
    expect(await stat(join(root, file)).catch(() => null), file).toBeNull();
  }
  expect(await readFile(join(root, "sitemap.xml"), "utf8")).not.toContain("/cloudforce/");
  expect(await stat(join(root, "redlink/index.html"))).toBeTruthy();
  expect(await stat(join(root, "redlink/privacy/index.html"))).toBeTruthy();
});
