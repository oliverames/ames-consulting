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

test("YouTube facade documents have no moderate, serious, or critical accessibility issues", async ({ page }) => {
  test.setTimeout(120_000);
  const videoRoutes = [
    "/work/eastrise-photography/",
    "/work/member-banking-stories/",
    "/work/fairbanks-planetarium/",
    "/work/beta-technologies/",
    "/work/flight-paths/",
    "/blog/",
  ];
  const facades = [];
  for (const route of videoRoutes) {
    await page.goto(route);
    facades.push(...await page
      .locator('iframe[src*="youtube-nocookie.com/embed/"]')
      .evaluateAll((frames) => frames.map((frame) => frame.getAttribute("srcdoc"))));
  }

  expect(facades).toHaveLength(17);
  for (const srcdoc of facades) {
    await page.setContent(srcdoc);
    const results = await new AxeBuilder({ page }).analyze();
    const actionable = results.violations.filter(
      (violation) => ["moderate", "serious", "critical"].includes(violation.impact),
    );
    expect(actionable).toEqual([]);
  }
});

test("inbound project prompt has no moderate, serious, or critical accessibility issues", async ({ page }) => {
  await page.goto("/work/giron-family/");
  const launcher = page.getByRole("button", { name: "Send me a note" });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.4));
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.getByRole("dialog", {
    name: "Do you need photographs of people at work?",
  })).toBeVisible();

  const results = await new AxeBuilder({ page }).include("#inbound-prompt").analyze();
  const actionable = results.violations.filter(
    (violation) => ["moderate", "serious", "critical"].includes(violation.impact),
  );
  expect(actionable).toEqual([]);
});

test("full recommendation dialog has no moderate, serious, or critical accessibility issues", async ({ page }) => {
  await page.goto("/testimonials/");
  await page.getByRole("button", {
    name: "Read the full recommendation from Yvonne Garand",
  }).click();
  const dialog = page.getByRole("dialog", {
    name: "Recommendation from Yvonne Garand",
  });
  await expect(dialog).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include("#recommendation-dialog")
    .analyze();
  const actionable = results.violations.filter(
    (violation) => ["moderate", "serious", "critical"].includes(violation.impact),
  );
  expect(actionable).toEqual([]);
});
