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

test("EastRise writing archive contains every attributed article", async ({ page }) => {
  await page.goto("/work/eastrise-writing/");
  await expect(page.locator(".writing-list > li")).toHaveCount(53);
  await expect(page.getByText("A Comprehensive Guide to EV Charging Apps", { exact: true })).toBeVisible();
});

test("Writing is a personal Micro.blog-led social stream", async ({ page }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("link", { name: "Micro.blog is my blog" })).toHaveAttribute("href", "https://oliverames.micro.blog/");
  await expect(page.locator(".stream-post")).toHaveCount(30);
  await expect(page.getByRole("link", { name: "Threads", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Instagram", exact: true })).toBeVisible();
  await expect(page.getByText("The team that made this video truly cooked. Marketing at its finest!", { exact: true })).toBeVisible();
});
