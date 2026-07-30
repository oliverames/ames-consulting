import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("construction gate protects direct routes and remembers access", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto("/work/");
  const gate = page.getByRole("dialog", { name: "The site is under construction." });
  await expect(gate).toBeVisible();
  await expect(page.locator("#construction-gate-password")).toBeFocused();

  await page.locator("#construction-gate-password").fill("horses");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page.getByRole("alert")).toHaveText("That password did not work. Try again.");

  await page.locator("#construction-gate-password").fill("COWS");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(gate).toBeHidden();

  await page.goto("/about/");
  await expect(page.locator("#construction-gate")).toBeHidden();
  await context.close();
});

test("construction gate has no serious accessibility violations", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/");

  const results = await new AxeBuilder({ page }).include("#construction-gate").analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);
  await context.close();
});
