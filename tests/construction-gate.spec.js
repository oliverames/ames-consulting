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

test("construction gate accepts the singular password with surrounding whitespace", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto("/");
  const gate = page.getByRole("dialog", { name: "The site is under construction." });
  await expect(gate).toBeVisible();

  await page.locator("#construction-gate-password").fill("  Cow ");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(gate).toBeHidden();
  await context.close();
});

test("construction gate keeps typing responsive after the first keystroke", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto("/");
  const input = page.locator("#construction-gate-password");
  await expect(input).toBeFocused();

  // Type character by character rather than fill(), so a stalled main thread
  // would drop keystrokes the way it does for a real visitor.
  await page.keyboard.type("cows", { delay: 30 });
  await expect(input).toHaveValue("cows");

  // The page behind the gate must not be rendered, laid out, or reachable.
  const behindGate = await page.evaluate(() => {
    const main = document.querySelector("body > main");
    return main ? getComputedStyle(main).contentVisibility : null;
  });
  expect(behindGate).toBe("hidden");
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
