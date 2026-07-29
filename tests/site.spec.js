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

test("homepage service cards open article hubs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Strategy and content/ })).toHaveAttribute("href", "services/strategy-and-content/");
  await page.goto("/services/strategy-and-content/");
  await expect(page.locator(".service-article")).toHaveCount(4);
});

test("contact form submits to the site endpoint", async ({ page }) => {
  await page.route("**/api/contact", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto("/contact/");
  await page.getByLabel("Name").fill("Site Test");
  await page.getByLabel("Email").fill("site-test@example.com");
  await page.getByLabel("Organization (optional)").fill("Ames Consulting");
  await page.getByLabel("What kind of work?").selectOption({ label: "Website or digital system" });
  await page.getByLabel("Tell me about it").fill("Testing the contact form.");
  await page.evaluate(() => { document.querySelector("#contact-started-at").value = String(Date.now() - 4000); });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toHaveText("Thanks, your message was sent.");
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
  await expect(page.locator(".work-category:first-of-type .work-item")).toHaveCount(10);
  await expect(page.getByRole("heading", { name: "Taylor Hoar Racing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wheels for Warmth" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Portraits and People" })).toBeVisible();
});

test("GMCF shoots use complete collages with paged lightboxes", async ({ page }) => {
  await page.goto("/work/sweat-heart-throwdown/");
  await expect(page.locator(".campaign-collage img")).toHaveCount(22);
  await page.locator(".campaign-collage img").first().click();
  await expect(page.locator("#image-viewer")).toBeVisible();
  await expect(page.locator("#image-viewer-caption")).toContainText("1 of 22");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#image-viewer-caption")).toContainText("2 of 22");
  await page.getByRole("button", { name: "Previous image" }).click();
  await expect(page.locator("#image-viewer-caption")).toContainText("1 of 22");

  await page.goto("/work/bike-fitting/");
  await expect(page.locator(".campaign-collage img")).toHaveCount(23);
});

test("earlier and institutional work use linked case cards", async ({ page }) => {
  await page.goto("/work/");
  await expect(page.getByRole("heading", { name: "Client and institutional work" })).toBeVisible();
  await expect(page.getByRole("link", { name: /BETA Technologies/ })).toHaveAttribute("href", "beta-technologies/");
  await expect(page.getByRole("heading", { name: "Earlier work" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Membership conversion/ })).toHaveAttribute("href", "vtdigger-membership/");
  await expect(page.getByRole("link", { name: /Planetarium growth/ })).toHaveAttribute("href", "fairbanks-planetarium/");
  await expect(page.getByRole("link", { name: /Live broadcasts/ })).toHaveAttribute("href", "live-broadcasts/");
});

test("about page works as a professional profile and resume", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.locator('img[alt="Oliver Ames smiling outdoors in Vermont"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "The fuller version." })).toBeVisible();
  await expect(page.locator(".about-role")).toHaveCount(8);
  await expect(page.getByText("Boston University", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "oliver@ames.consulting" })).toHaveAttribute("href", "mailto:oliver@ames.consulting");
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
