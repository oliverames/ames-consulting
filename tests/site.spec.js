import { test, expect } from "@playwright/test";

test("homepage presents the company and verified proof", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page).toHaveTitle(/Ames Consulting/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("complex ideas");
  const firstMetric = page.locator(".proof__link").first();
  await expect(firstMetric).toBeVisible();
  await expect(firstMetric).toHaveAttribute("href", "work/eastrise/");
  await firstMetric.hover();
  await expect(firstMetric.getByRole("tooltip")).toBeVisible();
  await page.clock.fastForward("00:00:07");
  await expect(firstMetric).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.fastForward("00:00:07");
  await expect(page.getByText("569%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause metrics" }).click();
  await page.clock.fastForward("00:00:07");
  await expect(page.getByText("569%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /See the work/ })).toBeVisible();
});

test("homepage proof respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await page.clock.fastForward("00:00:07");
  await expect(page.getByText("319%", { exact: true })).toBeVisible();
  await expect(page.getByText("569%", { exact: true })).toBeHidden();
});

test("website campaign contains the two PixelSpoke redesigns", async ({ page }) => {
  await page.goto("/work/credit-union-websites/");
  await expect(page.getByRole("heading", { name: "Two credit union websites, rebuilt around clearer paths." })).toBeVisible();
  await expect(page.getByText(/I was integral.*vsecu.com and eastrise.com/)).toBeVisible();
});

test("community photography series uses the verified portfolio", async ({ page }) => {
  await page.goto("/work/community-photography/");
  await expect(page.locator(".media-grid img")).toHaveCount(7);
});

test("Flight Paths is a standalone video series", async ({ page }) => {
  await page.goto("/work/flight-paths/");
  await expect(page.locator('iframe[src*="4r5N5DjmSCU"]')).toHaveCount(1);
});

test("work is organized by campaign rather than employer", async ({ page }) => {
  await page.goto("/work/");
  await expect(page.locator(".work-list > .work-item")).toHaveCount(8);
  await expect(page.getByRole("heading", { name: "Taylor Hoar Racing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wheels for Warmth" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Portraits and People" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "EastRise Credit Union" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Blue Cross Vermont" })).toHaveCount(0);
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
  const writingProfiles = page.getByLabel("Writing profiles");
  await expect(writingProfiles.getByRole("link", { name: "Threads", exact: true })).toBeVisible();
  await expect(writingProfiles.getByRole("link", { name: "Instagram", exact: true })).toBeVisible();
  await expect(page.getByText("The team that made this video truly cooked. Marketing at its finest!", { exact: true })).toBeVisible();
});
