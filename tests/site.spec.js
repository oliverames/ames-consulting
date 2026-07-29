import { test, expect } from "@playwright/test";

test("homepage presents the company and verified proof", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page).toHaveTitle(/Ames Consulting/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /Photography leads the work/ }),
  ).toBeVisible();
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

test("homepage chooses a new photography-led headline on refresh", async ({
  page,
}) => {
  await page.goto("/");
  const headline = page.locator("[data-hero-headline]");
  const first = await headline.textContent();
  await page.reload();
  await expect(headline).not.toHaveText(first);

  const expectedHeadlines = [
    "I photograph people doing work that matters.",
    "I make photographs that feel like the people in them.",
    "I photograph the moments that explain what an organization does.",
    "I turn real work into photographs people remember.",
    "I translate complex ideas into stories people care about.",
  ];
  expect(expectedHeadlines).toContain(first);
  expect(expectedHeadlines).toContain(await headline.textContent());
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
  await expect(
    page.getByRole("link", { name: /Strategy and content/ }),
  ).toHaveAttribute("href", "services/strategy-and-content/");
  await page.goto("/services/strategy-and-content/");
  await expect(page.locator(".service-article")).toHaveCount(4);
});

test("homepage campaign strip keeps its first card on the content gutter", async ({
  page,
}) => {
  for (const width of [900, 390]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/");
    const positions = await page.locator(".home-paths").evaluate((section) => {
      const heading = section.querySelector("h2").getBoundingClientRect();
      const firstCard = section
        .querySelector(".path-thumb")
        .getBoundingClientRect();
      return { headingLeft: heading.left, cardLeft: firstCard.left };
    });
    expect(
      Math.abs(positions.headingLeft - positions.cardLeft),
    ).toBeLessThanOrEqual(1);
  }
  await expect(
    page.getByRole("heading", { name: "Taylor Hoar Racing 2025" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wheels for Warmth 2025" }),
  ).toBeVisible();
});

test("homepage metrics remain structured at narrow desktop widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 785, height: 863 });
  await page.goto("/");
  const layout = await page.locator(".hero__proof").evaluate((proof) => {
    const pageStyles = getComputedStyle(proof.querySelector(".proof__page"));
    const tooltipStyles = getComputedStyle(
      proof.querySelector(".proof__source"),
    );
    return {
      columns: pageStyles.gridTemplateColumns.split(" ").length,
      tooltipDisplay: tooltipStyles.display,
    };
  });
  expect(layout.columns).toBe(2);
  expect(layout.tooltipDisplay).toBe("none");
  await page.locator(".proof__link").first().hover();
  await expect(page.locator(".proof__source").first()).toBeVisible();
});

test("contact form submits to the site endpoint", async ({ page }) => {
  await page.route("**/api/contact", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    }),
  );
  await page.goto("/contact/");
  await page.getByLabel("Name").fill("Site Test");
  await page.getByLabel("Email").fill("site-test@example.com");
  await page.getByLabel("Organization (optional)").fill("Ames Consulting");
  await page
    .getByLabel("What kind of work?")
    .selectOption({ label: "Website or digital system" });
  await page.getByLabel("Tell me about it").fill("Testing the contact form.");
  await page.evaluate(() => {
    document.querySelector("#contact-started-at").value = String(
      Date.now() - 4000,
    );
  });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Thanks, your message was sent.",
  );
});

test("website campaign contains the two PixelSpoke redesigns", async ({
  page,
}) => {
  await page.goto("/work/credit-union-websites/");
  await expect(
    page.getByRole("heading", {
      name: "Two credit union websites built for clearer paths.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /extensive quality assurance, image curation, coding for content migration/,
    ),
  ).toBeVisible();
  await expect(page.locator(".website-screen-gallery img")).toHaveCount(5);
  await expect(
    page.getByRole("link", { name: /EastRise case study/ }),
  ).toHaveAttribute(
    "href",
    "https://www.pixelspoke.coop/eastrise-credit-union-case-study",
  );
});

test("member banking stories separates the Urban Rhino series", async ({
  page,
}) => {
  await page.goto("/work/member-banking-stories/");
  await expect(page.locator(".urban-rhino-series .video-card")).toHaveCount(9);
  await expect(page.locator(".additional-film-series .video-card")).toHaveCount(
    2,
  );
  await expect(
    page.locator("iframe[src*='youtube-nocookie.com/embed/']"),
  ).toHaveCount(11);
  await expect(
    page.getByText("Produced with Urban Rhino · 2025–2026"),
  ).toBeVisible();
  await expect(
    page.getByText("Will's story · 15 seconds · April 8, 2026"),
  ).toBeVisible();
});

test("community photography series uses the verified portfolio", async ({
  page,
}) => {
  await page.goto("/work/community-photography/");
  await expect(page.locator(".media-grid img")).toHaveCount(7);
});

test("event photography is split into complete campaign galleries", async ({
  page,
}) => {
  const campaigns = [
    ["/work/corporate-cup-2026/", 9],
    ["/work/girls-on-the-run-2026/", 185],
    ["/work/eastrise-launch-campaign/", 10],
  ];
  for (const [route, count] of campaigns) {
    await page.goto(route);
    await expect(page.locator(".campaign-collage img")).toHaveCount(count);
  }
  await page.locator(".campaign-collage img").first().click();
  await expect(page.locator("#image-viewer-caption")).toContainText("1 of 10");
});

test("Taylor Hoar Milk Bowl story uses a paged photo gallery", async ({
  page,
}) => {
  await page.goto("/work/taylor-hoar-racing/");
  const gallery = page.getByRole("group", {
    name: "2025 Milk Bowl photo gallery",
  });
  await expect(gallery.locator("img")).toHaveCount(8);
  await gallery.locator("img").first().click();
  await expect(page.locator("#image-viewer")).toBeVisible();
  await expect(page.locator("#image-viewer-caption")).toContainText("1 of 8");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#image-viewer-caption")).toContainText("2 of 8");
});

test("portrait work is a complete framed gallery", async ({ page }) => {
  await page.setViewportSize({ width: 785, height: 863 });
  await page.goto("/work/portraits-and-people/");
  await expect(page.locator(".portrait-series")).toHaveCount(2);
  const portraitCount = await page.locator(".portrait-gallery img").count();
  expect(portraitCount).toBeGreaterThan(40);
  const firstGallery = page.locator(".portrait-gallery").first();
  const firstGalleryCount = await firstGallery.locator("img").count();
  const firstPortrait = firstGallery.locator("img").first();
  await firstPortrait.click();
  await expect(page.locator("#image-viewer")).toBeVisible();
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `1 of ${firstGalleryCount}`,
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `2 of ${firstGalleryCount}`,
  );
});

test("Flight Paths is a standalone video series", async ({ page }) => {
  await page.goto("/work/flight-paths/");
  await expect(page.locator('iframe[src*="4r5N5DjmSCU"]')).toHaveCount(1);
});

test("work is organized by campaign rather than employer", async ({ page }) => {
  await page.goto("/work/");
  await expect(
    page.locator(".work-category:first-of-type .work-item"),
  ).toHaveCount(13);
  await expect(
    page.getByRole("heading", { name: "Taylor Hoar Racing 2025" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wheels for Warmth 2025" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Corporate Cup 2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Girls on the Run 2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "EastRise Launch Campaign" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Portraits and People" }),
  ).toBeVisible();

  const sections = page.locator(".work-category");
  await expect(sections).toHaveCount(3);
  const hrefs = async (section) =>
    section.locator(".work-item").evaluateAll((items) =>
      items.map((item) => item.getAttribute("href")),
    );
  expect(await hrefs(sections.nth(0))).toEqual([
    "girls-on-the-run-2026/",
    "corporate-cup-2026/",
    "flight-paths/",
    "portraits-and-people/",
    "member-banking-stories/",
    "sweat-heart-throwdown/",
    "eastrise-writing/",
    "wheels-for-warmth/",
    "taylor-hoar-racing/",
    "eastrise-photography/",
    "bike-fitting/",
    "eastrise-launch-campaign/",
    "credit-union-websites/",
  ]);
  expect(await hrefs(sections.nth(1))).toEqual([
    "blue-cross-vermont/",
    "beta-technologies/",
    "green-mountain-community-fitness/",
    "eastrise/",
  ]);
  expect(await hrefs(sections.nth(2))).toEqual([
    "live-broadcasts/",
    "vtdigger-membership/",
    "fairbanks-planetarium/",
  ]);
});

test("GMCF shoots use complete collages with paged lightboxes", async ({
  page,
}) => {
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

test("earlier and institutional work use linked case cards", async ({
  page,
}) => {
  await page.goto("/work/");
  await expect(
    page.getByRole("heading", { name: "Client and institutional work" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /BETA Technologies/ }),
  ).toHaveAttribute("href", "beta-technologies/");
  await expect(
    page.getByRole("heading", { name: "Earlier work" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Membership conversion/ }),
  ).toHaveAttribute("href", "vtdigger-membership/");
  await expect(
    page.getByRole("link", { name: /Planetarium growth/ }),
  ).toHaveAttribute("href", "fairbanks-planetarium/");
  await expect(
    page.getByRole("link", { name: /Live broadcasts/ }),
  ).toHaveAttribute("href", "live-broadcasts/");
});

test("about page works as a professional profile and resume", async ({
  page,
}) => {
  await page.goto("/about/");
  await expect(
    page.locator('img[alt="Oliver Ames smiling outdoors in Vermont"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The fuller version." }),
  ).toBeVisible();
  await expect(page.locator(".about-role")).toHaveCount(8);
  await expect(
    page.getByText("Boston University", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "oliver@ames.consulting" }),
  ).toHaveAttribute("href", "mailto:oliver@ames.consulting");
  await expect(
    page.locator(".about-testimonials .testimonial-card"),
  ).toHaveCount(4);
  await expect(page.getByText("Yvonne Garand", { exact: true })).toBeVisible();
  await expect(page.getByText("Brad Meerholz", { exact: true })).toBeVisible();
});

test("recommendations are distributed across relevant pages", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-testimonial")).toContainText(
    "Oliver is a rare talent",
  );
  await page.goto("/services/photography-and-video/");
  await expect(page.locator(".photography-testimonial")).toContainText(
    "natural eye for capturing moments",
  );
  await page.goto("/work/credit-union-websites/");
  await expect(page.locator(".website-testimonial")).toContainText(
    "Brad Meerholz",
  );
});

test("testimonials archive combines recommendations and review feedback", async ({
  page,
}) => {
  await page.goto("/testimonials/");
  await expect(page.locator(".recommendation-entry")).toHaveCount(13);
  await expect(page.locator(".review-entry")).toHaveCount(4);
  await expect(page.getByText("Yvonne Garand", { exact: true })).toBeVisible();
  await expect(page.getByText("Brad Meerholz", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Testimonials" })).toHaveCount(1);
});

test("EastRise writing archive contains every attributed article", async ({
  page,
}) => {
  await page.goto("/work/eastrise-writing/");
  await expect(page.locator(".writing-list > li")).toHaveCount(53);
  await expect(
    page.getByText("A Comprehensive Guide to EV Charging Apps", {
      exact: true,
    }),
  ).toBeVisible();
});

test("EastRise photography is grouped into complete public-source galleries", async ({
  page,
}) => {
  await page.goto("/work/eastrise-photography/");
  await expect(page.locator(".photo-series")).toHaveCount(11);
  await expect(page.locator(".campaign-collage img")).toHaveCount(165);
  const firstGallery = page.locator(".campaign-collage").first();
  const firstGalleryCount = await firstGallery.locator("img").count();
  await firstGallery.locator("img").first().click();
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `1 of ${firstGalleryCount}`,
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `2 of ${firstGalleryCount}`,
  );
});

test("Writing uses social cards and opens long-form posts on-site", async ({
  page,
}) => {
  await page.goto("/blog/");
  await expect(
    page.getByRole("link", { name: "Micro.blog is my blog" }),
  ).toHaveAttribute("href", "https://oliverames.micro.blog/");
  await expect(page.locator(".social-card")).toHaveCount(34);
  await expect(page.locator(".social-card__media")).toHaveCount(6);
  const writingProfiles = page.getByLabel("Writing profiles");
  await expect(
    writingProfiles.getByRole("link", { name: "Threads", exact: true }),
  ).toBeVisible();
  await expect(
    writingProfiles.getByRole("link", { name: "Instagram", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The team that made this video truly cooked. Marketing at its finest!",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: "Read on ames.consulting" }).click();
  await expect(page).toHaveURL(
    /\/blog\/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids\/$/,
  );
  await expect(page.locator(".writing-article__body p")).toHaveCount(10);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The Sunshine Trail",
  );
});
