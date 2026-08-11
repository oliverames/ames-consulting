import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PUBLIC_HTML_FILES } from "../scripts/publication-policy.mjs";

const publicRoutes = PUBLIC_HTML_FILES.map((filePath) => {
  if (filePath === "index.html") return "/";
  if (filePath === "404.html") return "/404.html";
  return `/${filePath.replace(/index\.html$/, "")}`;
});

for (const route of publicRoutes) {
  test(`no moderate, serious, or critical accessibility issues on ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .exclude(".video-embed")
      .analyze();
    const actionable = results.violations.filter(
      (violation) => ["moderate", "serious", "critical"].includes(violation.impact),
    );

    expect(
      actionable,
      `Moderate, serious, or critical accessibility issues found on ${route}`,
    ).toEqual([]);
  });
}

test("inbound project prompt has no moderate, serious, or critical accessibility issues", async ({ page }) => {
  await page.goto("/work/giron-family-fall-2025/");
  const launcher = page.getByRole("button", { name: "Start a project" });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.4));
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.getByRole("dialog", {
    name: "Need photographs that feel like the people in them?",
  })).toBeVisible();

  const results = await new AxeBuilder({ page }).include("#inbound-prompt").analyze();
  const actionable = results.violations.filter(
    (violation) => ["moderate", "serious", "critical"].includes(violation.impact),
  );
  expect(actionable).toEqual([]);
});
