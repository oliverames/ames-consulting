import { test, expect } from "@playwright/test";

test("homepage presents the company and verified proof", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Ames Consulting/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("complex ideas");
  await expect(page.getByText("319%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /See the work/ })).toBeVisible();
});

test("work history contains the two PixelSpoke redesigns", async ({ page }) => {
  await page.goto("/work/eastrise/");
  await expect(page.getByRole("heading", { name: "Two PixelSpoke website redesigns" })).toBeVisible();
  await expect(page.getByText(/I was integral.*vsecu.com and eastrise.com/)).toBeVisible();
});

test("Blue Cross page uses the photography portfolio", async ({ page }) => {
  await page.goto("/work/blue-cross-vermont/");
  await expect(page.locator(".media-grid img")).toHaveCount(6);
  await expect(page.locator('iframe[src*="4r5N5DjmSCU"]')).toHaveCount(1);
});
