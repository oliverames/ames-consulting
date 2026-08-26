import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const readEventGalleries = async () => JSON.parse(
  await readFile(new URL("../assets/data/event-galleries.json", import.meta.url), "utf8"),
);
const readEastRisePhotography = async () => JSON.parse(
  await readFile(new URL("../assets/data/eastrise-photography.json", import.meta.url), "utf8"),
);
const readEastRiseSocialPhotography = async () => JSON.parse(
  await readFile(new URL("../assets/data/eastrise-social-photography.json", import.meta.url), "utf8"),
);
const readPortraits = async () => JSON.parse(
  await readFile(new URL("../assets/data/portraits.json", import.meta.url), "utf8"),
);
const readWritingFeed = async () => JSON.parse(
  await readFile(new URL("../assets/data/writing-feed.json", import.meta.url), "utf8"),
);
const readEastRiseSocial = async () => JSON.parse(
  await readFile(new URL("../assets/data/eastrise-social.json", import.meta.url), "utf8"),
);
const taylorPageImages = (photography) => photography.series
  .find((series) => series.slug === "taylor-hoar-racing")
  .images
  .filter((image) => !image.src.endsWith("/Original-Public-Image-8998855be149.webp"))
  .toSorted((left, right) => (
    right.publishedDate || right.capturedDate || ""
  ).localeCompare(left.publishedDate || left.capturedDate || ""));

test("homepage presents the company and verified proof", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Ames Consulting/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /I’m a photographer in Montpelier, Vermont/ }),
  ).toBeVisible();
  const firstMetric = page.locator(".proof__link").first();
  await expect(firstMetric).toBeVisible();
  await expect(firstMetric).toHaveAttribute("href", "work/eastrise/");
  await firstMetric.hover();
  await expect(firstMetric.getByRole("tooltip")).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.getByText("319%", { exact: true })).toBeVisible();
  await expect(page.locator(".proof__controls, .proof__control")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /See my projects/ })).toBeVisible();
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
    "I photograph people while they’re doing the work.",
    "I photograph people at work, at events, and in their communities.",
    "I photograph employees, customers, and volunteers for organizations.",
    "I make portrait and workplace photographs on location.",
    "I photograph portraits, events, and documentary projects across Vermont.",
  ];
  expect(expectedHeadlines).toContain(first);
  expect(expectedHeadlines).toContain(await headline.textContent());
});

test("homepage proof stays static without navigation controls", async ({ page }) => {
  await page.goto("/");
  const proof = page.locator(".hero__proof");
  await expect(proof).toHaveAttribute("aria-label", "Selected results");
  await expect(proof.locator(".proof__page")).toHaveCount(1);
  await expect(proof.locator(".proof__item")).toHaveCount(4);
  await expect(page.getByText("319%", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /results/i })).toHaveCount(0);
});

test("homepage service cards open article hubs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Strategy and content/ }),
  ).toHaveAttribute("href", "services/strategy-and-content/");
  await page.goto("/services/strategy-and-content/");
  await expect(page.locator(".service-story")).toHaveCount(2);
  await expect(page.locator(".service-project")).toHaveCount(3);
  await expect(page.locator(".service-proof")).toHaveAttribute(
    "href",
    "../../work/eastrise-social/",
  );
});

test("service pages keep their editorial layout at mobile widths", async ({
  page,
}) => {
  for (const route of [
    "/services/strategy-and-content/",
    "/services/photography-and-video/",
    "/services/practical-technology/",
  ]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator(".service-hero")).toBeVisible();
    await expect(page.locator(".service-story")).toHaveCount(2);
    await expect(page.locator(".service-project")).toHaveCount(3);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  }
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
  await expect(page.locator(".home-paths .path-thumb").first()).toHaveAttribute(
    "href",
    "work/neg-ecp-conference-2026/",
  );
  await expect(
    page.getByRole("heading", { name: "47th NEG-ECP Conference", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Taylor Hoar Racing", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wheels for Warmth", exact: true }),
  ).toBeVisible();
  const stripStyles = await page.locator(".home-paths .path-strip").evaluate((strip) => ({
    overflowX: getComputedStyle(strip).overflowX,
    scrollbarWidth: getComputedStyle(strip).scrollbarWidth,
    webkitScrollbarDisplay: getComputedStyle(strip, "::-webkit-scrollbar").display,
  }));
  expect(stripStyles).toEqual({
    overflowX: "auto",
    scrollbarWidth: "none",
    webkitScrollbarDisplay: "none",
  });
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
  await expect(page.locator("#contact-form")).toBeVisible();
  await expect(page.locator("#contact-form-fallback")).toBeHidden();
  await expect(
    page.getByRole("link", { name: "oliver@ames.consulting" }),
  ).toHaveAttribute("href", "mailto:oliver@ames.consulting");
  await expect(page.getByRole("status")).toBeHidden();
  await expect(page.locator(".cf-turnstile")).toHaveAttribute(
    "data-appearance",
    "interaction-only",
  );
  await expect(page.locator(".cf-turnstile")).toHaveAttribute(
    "data-action",
    "contact",
  );
  await page.getByLabel("Name").fill("Site Test");
  await page.getByLabel("Email").fill("site-test@example.com");
  await page.getByLabel("Organization (optional)").fill("Ames Consulting");
  await page.getByLabel("What kind of work?").selectOption({ label: "Practical technology" });
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

test("contact form discards attempt timestamps from a future clock", async ({ page }) => {
  await page.route("**/api/contact", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    }),
  );
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.turnstile = { reset() {} };",
    }),
  );
  await page.goto("/contact/");
  await page.evaluate(() => {
    const future = Date.now() + 60 * 60 * 1000;
    localStorage.setItem(
      "ames_contact_attempt_timestamps",
      JSON.stringify([future, future + 1, future + 2]),
    );
  });
  await page.getByLabel("Name").fill("Clock Test");
  await page.getByLabel("Email").fill("clock-test@example.com");
  await page.getByLabel("Tell me about it").fill("Testing a corrected browser clock.");
  await page.evaluate(() => {
    document.querySelector("#contact-started-at").value = String(Date.now() - 4000);
  });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toHaveText("Thanks, your message was sent.");
});

test("contact page gives a direct alternative without JavaScript", async ({
  baseURL,
  browser,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();

  await page.goto("/contact/");
  await expect(page.locator("#contact-form")).toBeHidden();
  const fallback = page.locator("#contact-form-fallback");
  await expect(fallback).toBeVisible();
  await expect(
    fallback.getByRole("link", { name: "oliver@ames.consulting" }),
  ).toHaveAttribute("href", "mailto:oliver@ames.consulting");

  await context.close();
});

test("contact form loads Turnstile after the first interaction", async ({ page }) => {
  let turnstileRequests = 0;
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js", async (route) => {
    turnstileRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.turnstile = { reset() {} };",
    });
  });

  await page.goto("/contact/");
  expect(turnstileRequests).toBe(0);

  await page.getByLabel("Name").focus();
  await expect.poll(() => turnstileRequests).toBe(1);

  await page.getByLabel("Email").focus();
  expect(turnstileRequests).toBe(1);
});

test("contact form fields use the high-contrast focus token", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.turnstile = { reset() {} };",
    });
  });

  for (const colorScheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/contact/");
    const nameField = page.getByLabel("Name");
    await nameField.focus();

    const focusStyles = await nameField.evaluate((field) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--focus-ring)";
      document.body.append(probe);
      const tokenColor = getComputedStyle(probe).color;
      probe.remove();

      const styles = getComputedStyle(field);
      return {
        offset: styles.outlineOffset,
        outlineColor: styles.outlineColor,
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
        tokenColor,
      };
    });

    expect(focusStyles).toEqual({
      offset: "3px",
      outlineColor: focusStyles.tokenColor,
      outlineStyle: "solid",
      outlineWidth: "3px",
      tokenColor: focusStyles.tokenColor,
    });
  }
});

test("engaged visitors get a restrained project prompt", async ({ page }) => {
  await page.clock.install();
  await page.goto("/work/giron-family/");
  await page.evaluate(() => localStorage.removeItem("ames_inbound_prompt_dismissed_at"));
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.5));
  await page.clock.fastForward("00:00:31");

  const dialog = page.getByRole("dialog", {
    name: "Do you need photographs of people at work?",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText(
    "Do you need photographs of people at work?",
  );
  await expect.poll(() => page.locator("html").evaluate(
    (element) => getComputedStyle(element).overflowY,
  )).toBe("hidden");
  await expect(
    dialog.getByRole("link", { name: /Send me a note/ }),
  ).toHaveAttribute(
    "href",
    "../../contact/?project=Photography%20and%20video",
  );

  await dialog.getByRole("button", { name: "Keep looking" }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.locator("html").evaluate(
    (element) => getComputedStyle(element).overflowY,
  )).not.toBe("hidden");
  await page.reload();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.5));
  await page.clock.fastForward("00:00:31");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Send me a note" }).click();
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.locator("html").evaluate(
    (element) => getComputedStyle(element).overflowY,
  )).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.locator("html").evaluate(
    (element) => getComputedStyle(element).overflowY,
  )).not.toBe("hidden");
});

test("a future dismissal timestamp does not suppress the inbound prompt", async ({ page }) => {
  await page.clock.install();
  await page.goto("/work/giron-family/");
  await page.evaluate(() => {
    localStorage.setItem(
      "ames_inbound_prompt_dismissed_at",
      String(Date.now() + 24 * 60 * 60 * 1000),
    );
  });
  await page.reload();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.5));
  await page.clock.fastForward("00:00:31");
  await expect(page.getByRole("dialog", {
    name: "Do you need photographs of people at work?",
  })).toBeVisible();
});

test("inbound project links preselect the contact form", async ({ page }) => {
  await page.goto("/contact/?project=Photography%20and%20video");
  await expect(page.getByLabel("What kind of work?")).toHaveValue("Photography and video");
  await expect(page.locator("[data-inbound-prompt]")).toHaveCount(0);
});

test("website projects are separated by institution", async ({
  page,
}) => {
  await page.goto("/work/credit-union-websites/");
  await expect(
    page.getByRole("heading", {
      name: "Credit union website projects",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /VSECU Website Redesign/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /EastRise Website Launch/ })).toBeVisible();
  await page.goto("/work/vsecu-website/");
  await expect(page.locator(".website-proof article")).toHaveCount(3);
  expect(await page.locator(".website-proof").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
  )).toBe(3);
  await expect(page.locator(".website-header-image img")).toHaveCount(1);
  await expect(page.locator(".website-screen-gallery img")).toHaveCount(0);
  await page.goto("/work/eastrise-website/");
  await expect(page.locator(".website-proof article")).toHaveCount(4);
  expect(await page.locator(".website-proof").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
  )).toBe(4);
  await expect(page.locator(".website-header-image img")).toHaveCount(1);
  await expect(page.locator(".website-screen-gallery img")).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: /EastRise case study/ }),
  ).toHaveAttribute(
    "href",
    "https://www.pixelspoke.coop/eastrise-credit-union-case-study",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work/vsecu-website/");
  expect(await page.locator(".website-proof").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
  )).toBe(1);
  await page.goto("/work/eastrise-website/");
  expect(await page.locator(".website-proof").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
  )).toBe(2);
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
  await expect(page.locator('.case-hero--family > img[src*="will-barbecue.webp"]')).toHaveCount(1);
  await expect(page.locator('.case-hero--family > img')).toHaveAttribute("loading", "eager");
  await expect(page.locator(".member-story-visual")).toHaveCount(0);
  await expect(page.locator('main img[src*="will-barbecue.webp"]')).toHaveCount(1);
  await expect(page.locator('iframe[data-youtube-poster]')).toHaveCount(11);
  await expect(page.locator('iframe[data-youtube-poster^="../../assets/images/work/eastrise/member-stories/"]')).toHaveCount(11);
});

test("YouTube facades defer every player until the visitor presses Play", async ({
  page,
}) => {
  const youtubeRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "www.youtube-nocookie.com") {
      youtubeRequests.push(request.url());
    }
  });
  const videoPages = [
    ["/work/eastrise-photography/", 2],
    ["/work/member-banking-stories/", 11],
    ["/work/fairbanks-planetarium/", 1],
    ["/work/flight-paths/", 1],
    ["/blog/", 2],
  ];

  for (const [route, expectedCount] of videoPages) {
    await page.goto(route);
    const videos = page.locator('iframe[src*="youtube-nocookie.com/embed/"]');
    await expect(videos).toHaveCount(expectedCount);
    await expect(
      page.locator('iframe[src*="youtube-nocookie.com/embed/"][srcdoc]'),
    ).toHaveCount(expectedCount);
  }

  expect(youtubeRequests).toEqual([]);
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.abort());
  await page
    .frameLocator('iframe[title="Flight Paths: Emma at BETA"]')
    .getByRole("link", { name: "Play Flight Paths: Emma at BETA" })
    .click();
  await expect.poll(() => youtubeRequests).toHaveLength(1);
  expect(youtubeRequests[0]).toMatch(/4r5N5DjmSCU\?autoplay=1$/);
});

test("event photography is split into complete campaign galleries", async ({
  page,
}) => {
  const { campaigns } = await readEventGalleries();
  const publishedCampaigns = campaigns.filter((campaign) => campaign.published !== false);
  const requiredGalleryCounts = new Map([
    ["neg-ecp-conference-2026", 35],
    ["london-2019", 8],
    ["vermont-foodbank-volunteer-day-2026", 38],
    ["whale-dance-randolph", 8],
    ["drone-photography", 62],
  ]);

  for (const [slug, count] of requiredGalleryCounts) {
    const campaign = publishedCampaigns.find((item) => item.slug === slug);
    expect(campaign, `${slug} should be a published event gallery`).toBeTruthy();
    expect(campaign.images, `${slug} should retain every selected photograph`).toHaveLength(count);
  }

  for (const campaign of publishedCampaigns) {
    await page.goto(`/work/${campaign.projectSlug || campaign.slug}/`);
    await expect(
      page.locator(`[data-gallery="${campaign.slug}"] img`),
      campaign.slug,
    ).toHaveCount(campaign.images.length);
  }

  const lightboxCampaign = publishedCampaigns.find(
    (campaign) => campaign.slug === "giron-family-fall-2025",
  );
  await page.goto("/work/giron-family/");
  await page.locator('[data-gallery="giron-family-fall-2025"] img').first().click();
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `1 of ${lightboxCampaign.images.length}`,
  );
});

test("Taylor Hoar presents the approved racing photographs newest first", async ({
  page,
}) => {
  const photography = await readEastRisePhotography();
  const pageImages = taylorPageImages(photography);

  await page.goto("/work/taylor-hoar-racing/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Taylor Hoar Racing",
  );
  await expect(page.locator(".metric-grid article")).toHaveCount(4);
  const racing = page.locator('[data-gallery="eastrise-taylor-hoar-racing"]');
  await expect(racing.locator("img")).toHaveCount(pageImages.length);
  expect(await racing.locator("img").evaluateAll((images) => (
    images.map((image) => image.getAttribute("src"))
  ))).toEqual(pageImages.map((image) => image.src));
  await expect(page.locator('img[src$="Original-Public-Image-8998855be149.webp"]')).toHaveCount(0);
  await expect(page.locator('[data-gallery="eastrise-veggievango-taylor-hoar"]')).toHaveCount(0);
  await expect(page.getByText("VeggieVanGo with Taylor Hoar", { exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("personal photo library");
  await expect(page.locator("body")).toContainText(
    "February–October 2025",
  );
  await racing.locator("img").first().click();
  const viewer = page.locator("#image-viewer");
  const viewerCaption = page.locator("#image-viewer-caption");
  await expect(viewer).toBeVisible();
  await expect(viewerCaption).toContainText(`1 of ${pageImages.length}`);
  await page.keyboard.press("ArrowRight");
  await expect(viewerCaption).toContainText(`2 of ${pageImages.length}`);
  await page.locator("#image-viewer-close").click();
});

test("Wheels for Warmth combines 2025 results with the 2024 photo series", async ({
  page,
}) => {
  const photography = await readEastRisePhotography();
  const photoSeries = photography.series.find(
    (series) => series.slug === "wheels-for-warmth-2024",
  );

  await page.goto("/work/wheels-for-warmth/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Wheels for Warmth",
  );
  await expect(page.locator(".metric-grid article")).toHaveCount(4);
  await expect(page.locator(".metric-grid")).toContainText("65,906");
  await expect(page.locator(".metric-grid")).toContainText("274");
  await expect(
    page.locator('[data-gallery="eastrise-wheels-for-warmth-2024"] img'),
  ).toHaveCount(photoSeries.images.length);
});

test("career pages keep private evidence and unsupported claims out of public copy", async ({
  page,
}) => {
  await page.goto("/work/live-broadcasts/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Live Broadcasts",
  );
  await expect(page.locator("body")).not.toContainText("10,000");
  await expect(page.locator("body")).not.toContainText("2025 resume");

  await page.goto("/work/vtdigger-membership/");
  await expect(page.locator("body")).not.toContainText("Local evidence");
  await expect(page.locator("body")).not.toContainText("archived VTDigger work sample");

  await page.goto("/work/");
  await expect(page.locator("body")).not.toContainText("10,000+");

  await page.goto("/services/practical-technology/");
  await expect(page.locator("body")).not.toContainText("10,000 viewers");
});

test("gallery images support keyboards and retain their context menus", async ({
  page,
}) => {
  const photography = await readEastRisePhotography();
  const pageImages = taylorPageImages(photography);
  await page.goto("/work/taylor-hoar-racing/");
  const gallery = page.locator('[data-gallery="eastrise-taylor-hoar-racing"]');
  const thumbnail = gallery.locator("img").first();

  await expect(thumbnail).toHaveAttribute("role", "button");
  await expect(thumbnail).toHaveAttribute("tabindex", "0");
  await expect(thumbnail).toHaveAttribute("aria-label", /^Open larger image:/);
  expect(await thumbnail.evaluate((image) => getComputedStyle(image).userSelect)).not.toBe("none");
  expect(
    await page.locator("main p").first().evaluate((paragraph) => getComputedStyle(paragraph).userSelect),
  ).not.toBe("none");
  expect(
    await thumbnail.evaluate((image) => {
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      image.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);

  await thumbnail.focus();
  await page.keyboard.press("Enter");
  const viewer = page.locator("#image-viewer");
  const viewerImage = page.locator("#image-viewer-image");
  const viewerCaption = page.locator("#image-viewer-caption");
  const captionCount = page.locator(".image-viewer-caption__count");
  await expect(viewer).toBeVisible();
  await expect(captionCount).toHaveText(
    new RegExp(`^\\d+ of ${pageImages.length}$`),
  );
  await expect(viewerCaption).toHaveAttribute("role", "status");
  await expect(viewerCaption).toHaveAttribute("aria-live", "polite");
  await expect(viewerCaption).toHaveAttribute("aria-atomic", "true");
  const initialCount = await captionCount.textContent();
  await expect(viewerImage).not.toHaveClass(/zoomable-image/);
  expect(await viewerImage.getAttribute("role")).toBeNull();
  expect(await viewerImage.getAttribute("aria-label")).toBeNull();
  expect(await viewerImage.evaluate((image) => image.tabIndex)).toBe(-1);
  expect(
    await viewerImage.evaluate((image) => {
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      image.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);
  expect(
    await viewerImage.evaluate((image) => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      image.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);

  await viewerImage.click();
  await expect(captionCount).toHaveText(initialCount);
  await expect(page.locator("#image-viewer-next")).toBeVisible();

  await page.keyboard.press("Escape");
  await page.emulateMedia({ media: "print" });
  await expect(thumbnail).toBeVisible();
});

test("decorative images stay out of the image viewer", async ({ page }) => {
  await page.goto("/work/apple-core/");
  const icon = page.locator(".software-console__brand img").first();

  await expect(icon).toHaveAttribute("alt", "");
  await expect(icon).not.toHaveClass(/zoomable-image/);
  await expect(icon).not.toHaveAttribute("role", "button");
  await expect(icon).not.toHaveAttribute("tabindex", "0");
});

test("primary actions retain a visible keyboard focus ring", async ({ page }) => {
  await page.goto("/");
  const button = page.locator(".hero .btn--primary").first();
  await button.focus();

  const styles = await button.evaluate((element) => {
    const buttonStyle = getComputedStyle(element);
    const surfaceStyle = getComputedStyle(element.closest(".hero"));
    return {
      outlineColor: buttonStyle.outlineColor,
      outlineStyle: buttonStyle.outlineStyle,
      outlineWidth: buttonStyle.outlineWidth,
      surfaceColor: surfaceStyle.backgroundColor,
    };
  });
  expect(styles.outlineStyle).toBe("solid");
  expect(styles.outlineWidth).toBe("3px");
  expect(styles.outlineColor).not.toBe(styles.surfaceColor);
});

test("portrait work is split into complete framed galleries", async ({ page }) => {
  const portraits = await readPortraits();
  const eastRisePortraits = portraits.series.find(
    (series) => series.slug === "eastrise-leadership-board",
  );
  expect(eastRisePortraits).toBeTruthy();
  expect(eastRisePortraits.images).toHaveLength(42);
  expect(new Set(eastRisePortraits.images.map((image) => image.caption)).size).toBe(41);
  expect(
    eastRisePortraits.images.filter((image) => !image.source),
  ).toEqual([]);
  expect(
    eastRisePortraits.images.filter((image) => !/^Portrait of /.test(image.alt)),
  ).toEqual([]);
  const officialPortraitNames = [
    "Elizabeth Morton",
    "Greg Hahr",
    "Mark Ackerly",
    "Valerie Beaudin",
    "Rick Hommel",
    "Sue Leonard",
    "Robert Miller",
    "Subha Luck",
    "Frank G. Harris",
    "Margaret H. O’Donnell",
    "Stephanie Meunier",
    "Julie Lineberger",
    "Amy Vaughan",
    "Michael Hogan",
    "George Sales",
    "Spencer Newman",
    "Arthur G. Woolf",
    "Yvonne Garand",
  ];
  const leadershipPortraits = eastRisePortraits.images.filter(
    (image) => image.portraitGroup === "leadership",
  );
  const additionalPortraits = eastRisePortraits.images.filter(
    (image) => image.portraitGroup === "portrait",
  );
  expect(leadershipPortraits).toHaveLength(18);
  expect(leadershipPortraits.map((image) => image.caption)).toEqual(officialPortraitNames);
  expect(additionalPortraits).toHaveLength(24);
  expect(new Set(additionalPortraits.map((image) => image.caption)).size).toBe(23);
  expect(additionalPortraits.filter((image) => image.caption === "Luke Buglion Gluck")).toHaveLength(2);
  await page.setViewportSize({ width: 785, height: 863 });
  await page.goto("/work/eastrise-portraits/");
  const portraitImages = page.locator(".portrait-gallery img");
  await expect(portraitImages).toHaveCount(42);
  const leadershipGallery = page.locator('[data-gallery="eastrise-leadership"]');
  const portraitsGallery = page.locator('[data-gallery="eastrise-portraits"]');
  await expect(leadershipGallery.locator("img")).toHaveCount(18);
  await expect(portraitsGallery.locator("img")).toHaveCount(24);
  await expect(leadershipGallery.locator('img[data-date-status="dated"]')).toHaveCount(18);
  await expect(portraitsGallery.locator('img[data-date-status="dated"]')).toHaveCount(24);
  const renderedLeadershipNames = await leadershipGallery.locator("img").evaluateAll((images) => images
    .map((image) => image.alt.replace(/^Portrait of /, "")));
  expect(renderedLeadershipNames).toEqual(officialPortraitNames);
  await expect(page.getByAltText("Portrait of Frank G. Harris")).toHaveCount(1);
  await expect(page.getByAltText("Portrait of Yvonne Garand")).toHaveCount(1);
  await expect(page.getByAltText("Portrait of Luke Buglion Gluck")).toHaveCount(2);
  const firstGallery = leadershipGallery;
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
  await page.locator("#image-viewer-close").click();
  await page.getByAltText("Portrait of Frank G. Harris").click();
  await expect(page.locator("#image-viewer-caption")).toContainText(
    "Frank G. Harris",
  );
});

test("Flight Paths is the sole BETA media project", async ({ page }) => {
  await page.goto("/work/");
  const flightPathsCard = page.locator('.work-item[href="flight-paths/"]');
  await expect(flightPathsCard).toHaveCount(1);
  await expect(flightPathsCard).toHaveAttribute("data-organization", "beta-technologies");
  await expect(flightPathsCard.locator('img[src="../assets/images/work/campaigns/flight-paths.webp"]')).toHaveCount(1);
  await expect(
    page.locator(
      '.work-item[data-organization="blue-cross-vermont"]:has(img), .work-item[data-organization="blue-cross-vermont"]:has(iframe)',
    ),
  ).toHaveCount(0);
  await expect(
    page.locator(
      '.work-item[href="beta-andrew/"], .work-item[href="beta-emma/"], .work-item[href="beta-ethan/"]',
    ),
  ).toHaveCount(0);

  await page.goto("/work/flight-paths/");
  await expect(page.locator("main img, main [data-gallery]")).toHaveCount(0);
  const video = page.locator(
    'iframe[src="https://www.youtube-nocookie.com/embed/4r5N5DjmSCU"]',
  );
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("srcdoc", /Play Flight Paths: Emma at BETA/);

  await page.goto("/work/beta-technologies/");
  await expect(page.locator("main img, main iframe, main [data-gallery]")).toHaveCount(0);
  await expect(page.locator('main a[href="../flight-paths/"]')).toHaveCount(1);
});

test("work is organized by campaign rather than employer", async ({ page }) => {
  await page.goto("/work/");
  if (test.info().config.metadata?.siteRoot === "_site") {
    const uvmCardImage = page.locator(
      'a.work-item[href="eastrise-photography/#uvm-mens-soccer-2025-title"] img',
    );
    await expect(uvmCardImage).toHaveAttribute(
      "srcset",
      /2025-11-24_facebook-002_01-06c6da9d97e7-512w\.webp 512w/,
    );
    await expect.poll(
      () => uvmCardImage.evaluate((image) => image.currentSrc),
    ).toMatch(/2025-11-24_facebook-002_01-06c6da9d97e7-512w\.webp$/);
  }
  await expect(
    page.getByRole("heading", { name: "Bike Shop Member Story", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".work-category--portraits .work-item")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Taylor Hoar Racing", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wheels for Warmth", exact: true }),
  ).toBeVisible();
  await expect(page.locator('a.work-item[href="taylor-hoar-racing/"]')).toHaveCount(1);
  await expect(page.locator('a.work-item[href="wheels-for-warmth/"]')).toHaveCount(1);
  await expect(
    page.locator('a.work-item[href="eastrise-photography/#veggievango-taylor-hoar-title"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('a.work-item[href="eastrise-photography/#wheels-for-warmth-2024-title"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "EastRise Launch Campaign" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "EastRise Portraits" }),
  ).toBeVisible();
  await expect(page.locator('a.work-item[href="giron-family/"]')).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Giron Family Portrait Sessions", exact: true }),
  ).toBeVisible();
  await expect(page.locator('a.work-item[href*="giron-family-"]')).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Vermont Foodbank Volunteer Day" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "London at Dusk" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Whale Dance in Randolph" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Drone Photography" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Flight Paths" })).toBeVisible();
  for (const withheldHeading of [
    "Senior Games Press Event",
    "ArrayRx Press Conference",
    "Walk@Lunch and Green Up",
    "Be Well at Work",
    "Corporate Cup 2026",
    "Girls on the Run 2026",
    "Blue Cross Portraits",
  ]) {
    await expect(
      page.getByRole("heading", { name: withheldHeading, exact: true }),
    ).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { name: "Andrew at BETA" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Emma at BETA" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ethan at BETA" })).toHaveCount(0);
  const sections = page.locator(".work-category");
  await expect(sections).toHaveCount(3);
  const hrefs = async (section) =>
    section.locator(".work-item").evaluateAll((items) =>
      items.map((item) => item.getAttribute("href")),
    );
  expect(await hrefs(sections.nth(2))).toEqual([
    "stowe-ski-instruction/",
    "vtdigger-membership/",
    "fairbanks-planetarium/",
    "connecticut-college/",
  ]);
});

test("EastRise social archive uses every cleared post capture", async ({ page }) => {
  const social = await readEastRiseSocial();
  await page.goto("/work/eastrise-social/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Selected social posts from VSECU and EastRise",
  );
  await expect(page.locator('[data-gallery="eastrise-social"] img')).toHaveCount(
    social.posts.length,
  );
  await expect(page.locator(".source-index")).toHaveCount(0);
  await expect(page.getByText("What the archive preserves")).toHaveCount(0);
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

test("Vermont Foodbank shoot uses the complete gallery and paged lightbox", async ({ page }) => {
  await page.goto("/work/vermont-foodbank-volunteer-day-2026/");
  await expect(page.locator(".campaign-collage img")).toHaveCount(38);
  await page.locator(".campaign-collage img").first().click();
  await expect(page.locator("#image-viewer")).toBeVisible();
  await expect(page.locator("#image-viewer-caption")).toContainText("1 of 38");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#image-viewer-caption")).toContainText("2 of 38");
});

test("BETA Technologies page points to the canonical Flight Paths film", async ({ page }) => {
  await page.goto("/work/beta-technologies/");
  await expect(page.locator("main iframe, main img, main [data-gallery]")).toHaveCount(0);
  await expect(page.locator('main a[href="../flight-paths/"]')).toHaveCount(1);
});

test("Fairbanks case study embeds Breaking Records in Science Education", async ({ page }) => {
  await page.goto("/work/fairbanks-planetarium/");
  await expect(page.locator('iframe[src*="lSi35li8dCg"]')).toHaveCount(1);
});

test("legacy work uses linked case cards", async ({
  page,
}) => {
  await page.goto("/work/");
  await expect(
    page.getByRole("heading", { name: "Legacy work" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /VTDigger Membership/ }),
  ).toHaveAttribute("href", "vtdigger-membership/");
  await expect(
    page.getByRole("link", { name: /Fairbanks Museum Planetarium/ }),
  ).toHaveAttribute("href", "fairbanks-planetarium/");
  await expect(page.getByRole("link", { name: /Connecticut College/ })).toHaveAttribute("href", "connecticut-college/");
});

test("about page works as a professional profile and resume", async ({
  page,
}) => {
  await page.goto("/about/");
  await expect(
    page.locator('img[alt="Oliver Ames smiling outdoors in Vermont"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Experience" }),
  ).toBeVisible();
  await expect(
    page.locator(".about-experience .section-heading__statement"),
  ).toHaveText("Here’s the longer version.");
  await expect(page.locator(".about-role")).toHaveCount(9);
  const betaRole = page.locator(".about-role").filter({
    has: page.getByRole("heading", { name: "BETA Technologies", exact: true }),
  });
  const blueCrossRole = page.locator(".about-role").filter({
    has: page.getByRole("heading", { name: "Blue Cross Vermont", exact: true }),
  });
  await expect(betaRole).toContainText("Flight Paths");
  await expect(blueCrossRole).not.toContainText("Flight Paths");
  await expect(
    page.getByText("Boston University", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "oliver@ames.consulting" }),
  ).toHaveAttribute("href", "mailto:oliver@ames.consulting");
  await expect(
    page.locator(".about-testimonials .testimonial-card"),
  ).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: /view more testimonials/i }),
  ).toHaveAttribute("href", "../testimonials/");
  await expect(page.getByText("Yvonne Garand", { exact: true })).toBeVisible();
  await expect(page.getByText("Brad Meerholz", { exact: true })).toBeVisible();
});

test("recommendations are distributed across relevant pages", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-testimonial").first()).toContainText(
    "Oliver is a rare talent",
  );
  await expect(page.locator(".home-testimonial").nth(1)).toContainText(
    "During the EastRise launch",
  );
  await page.goto("/services/photography-and-video/");
  await expect(page.locator(".photography-testimonial")).toContainText(
    "natural eye for capturing moments",
  );
  await page.goto("/work/eastrise-website/");
  await expect(page.locator(".website-testimonial")).toContainText(
    "Brad Meerholz",
  );
});

test("testimonials archive contains public recommendations only", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/testimonials/");
  await expect(page.locator(".recommendation-entry")).toHaveCount(13);
  await expect(page.locator(".review-entry")).toHaveCount(0);
  await expect(page.getByText("Yvonne Garand", { exact: true })).toBeVisible();
  await expect(page.getByText("Brad Meerholz", { exact: true })).toBeVisible();
  await expect(page.locator(".recommendation-entry details")).toHaveCount(0);
  await expect(page.locator(".recommendation-entry img")).toHaveCount(12);
  await expect(page.locator(".recommendation-entry .testimonial-card__initials")).toHaveCount(1);
  await expect(
    page.locator(".recommendation-entry").filter({ hasText: "Jan Reynolds" }).locator(".testimonial-card__initials"),
  ).toHaveText("JR");
  await expect(
    page.locator(".recommendation-entry").filter({ hasText: "Simeon Chapin" }).locator('img[src$="simeon-chapin.webp"]'),
  ).toHaveAttribute("alt", "Simeon Chapin");
  await expect(
    page.locator(".recommendation-entry").filter({ hasText: "Abigail Stevenson" }).locator('img[src$="abigail-stevenson.webp"]'),
  ).toHaveAttribute("alt", "Abigail Stevenson");
  const yvonneButton = page.getByRole("button", {
    name: "Read the full recommendation from Yvonne Garand",
  });
  const yvonneProfile = page
    .locator(".recommendation-entry")
    .filter({ hasText: "Yvonne Garand" })
    .getByRole("link", { name: "View LinkedIn profile" });
  await expect(yvonneProfile).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/yvonnegarand",
  );
  await yvonneButton.click();
  const dialog = page.getByRole("dialog", {
    name: "Recommendation from Yvonne Garand",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("valuable asset to any team");
  await expect(page.locator("html")).toHaveClass(/has-open-dialog/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(yvonneButton).toBeFocused();
  await expect(page.locator("html")).not.toHaveClass(/has-open-dialog/);

  const randyButton = page.getByRole("button", {
    name: "Read the full recommendation from Randy Repass Jr.",
  });
  await randyButton.click();
  const randyDialog = page.getByRole("dialog", {
    name: "Recommendation from Randy Repass Jr.",
  });
  await expect(randyDialog).toContainText("world changing devices");
  await page.keyboard.press("Escape");
  await expect(randyDialog).toBeHidden();
  await expect(randyButton).toBeFocused();

  const firstRowButton = page.locator(
    ".recommendation-entry:has(.recommendation-entry__actions) .recommendation-entry__more",
  ).first();
  const buttonColors = await firstRowButton.evaluate((button) => {
    const styles = getComputedStyle(button);
    return {
      background: styles.backgroundColor,
      border: styles.borderTopColor,
    };
  });
  expect(buttonColors.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(buttonColors.background).toBe(buttonColors.border);
  await expect(
    page.locator('.site-nav a[href="../testimonials/"]'),
  ).toHaveAttribute("aria-current", "page");
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
  await expect(
    page.getByRole("link", {
      name: /A Comprehensive Guide to EV Charging Apps/,
    }),
  ).toHaveCount(0);
});

test("EastRise photography is grouped into complete public-source galleries", async ({
  page,
}) => {
  const photography = await readEastRisePhotography();
  const socialCoverage = await readEastRiseSocialPhotography();
  expect(photography.totalImages).toBe(173);
  expect(photography.series).toHaveLength(16);
  expect(socialCoverage).toMatchObject({
    photographicPostCount: 28,
    excludedPostCount: 1,
    photographicPlacements: 165,
    distinctPortfolioAssets: 126,
    newlyImportedAssets: 37,
  });
  expect(photography.series.some((series) => series.slug === "formal-headshots")).toBe(false);
  expect(
    photography.series.find((series) => series.slug === "smokin-somethin-bbq")?.images,
  ).toHaveLength(1);
  expect(
    photography.series.find((series) => series.slug === "uvm-mens-soccer-2025")?.images,
  ).toHaveLength(5);
  expect(
    photography.series.find((series) => series.slug === "wheels-for-warmth-2025")?.images,
  ).toHaveLength(16);
  const candidPortraits = photography.series.find(
    (series) => series.slug === "eastrise-candid-portraits",
  );
  expect(candidPortraits.images).toHaveLength(1);
  const expectedImageCount = photography.series.reduce(
    (total, series) => total + series.images.length,
    0,
  );
  await page.goto("/work/eastrise-photography/");
  await expect(page.locator(".photo-series")).toHaveCount(photography.series.length);
  await expect(page.locator(".campaign-collage img")).toHaveCount(expectedImageCount);
  await expect(
    page.locator('[aria-labelledby="taylor-hoar-racing-title"] .campaign-collage img').first(),
  ).toHaveAttribute("src", /featured-2025-dsc07501\.webp$/);
  const karinaVideo = page.locator(
    "#karina-and-ryan-title + p + .photo-series__video iframe",
  );
  await expect(karinaVideo).toHaveAttribute("src", /A1oAN6Ox6A0/);
  await expect(karinaVideo).toHaveAttribute(
    "srcdoc",
    /Play Karina and Ryan member story/,
  );
  await expect(
    page
      .frameLocator("#karina-and-ryan-title + p + .photo-series__video iframe")
      .getByRole("link", { name: "Play Karina and Ryan member story" }),
  ).toHaveAttribute("href", /A1oAN6Ox6A0\?autoplay=1$/);
  const johnVideo = page.locator(
    "#john-and-donia-title + p + .photo-series__video iframe",
  );
  await expect(johnVideo).toHaveAttribute("src", /dffKrKG5Hbs/);
  await expect(johnVideo).toHaveAttribute(
    "srcdoc",
    /Play John and Donia member story/,
  );
  if (test.info().config.metadata?.siteRoot === "_site") {
    await expect(karinaVideo).toHaveAttribute(
      "data-youtube-poster",
      /A1oAN6Ox6A0\.webp$/,
    );
    await expect(karinaVideo).toHaveAttribute(
      "srcdoc",
      /A1oAN6Ox6A0-960w\.webp/,
    );
    await expect(johnVideo).toHaveAttribute(
      "data-youtube-poster",
      /dffKrKG5Hbs\.webp$/,
    );
    await expect(johnVideo).toHaveAttribute(
      "srcdoc",
      /dffKrKG5Hbs-960w\.webp/,
    );
  }
  const johnAndDonia = photography.series.find(
    (series) => series.slug === "john-and-donia",
  );
  expect(johnAndDonia).toBeTruthy();
  await expect(
    page.locator('[aria-labelledby="john-and-donia-title"] .campaign-collage img'),
  ).toHaveCount(johnAndDonia.images.length);
  await expect(
    page.getByRole("heading", { name: "Bike Shop Member Story", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('img[src*="li_38643aee028f-03e615af6186"]')).toHaveCount(0);
  const multiImageGallery = page.locator('[aria-labelledby="taylor-hoar-racing-title"] .campaign-collage');
  const multiImageGalleryCount = await multiImageGallery.locator("img").count();
  await multiImageGallery.locator("img").first().click();
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `1 of ${multiImageGalleryCount}`,
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#image-viewer-caption")).toContainText(
    `2 of ${multiImageGalleryCount}`,
  );
});

test("EastRise photography deep links clear the sticky header", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/work/eastrise-photography/#smokin-somethin-bbq-title");
    await expect.poll(async () => page.locator("#smokin-somethin-bbq-title").evaluate((heading) => {
      const header = document.querySelector(".site-header");
      return heading.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    })).toBeGreaterThanOrEqual(-1);
  }
});

test("Writing uses social cards and opens long-form posts on-site", async ({
  page,
}) => {
  const writingFeed = await readWritingFeed();
  const isLongForm = (post) => post.platforms.includes("Micro.blog") && (post.title || (post.text || "").length >= 800);
  // Mirror the generator: the past-year window anchors on refreshedAt, not
  // the wall clock, so this expectation stays stable across days.
  const oneYearAgo = new Date(writingFeed.refreshedAt);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  const expectedLinkedInPosts = writingFeed.posts.filter(
    (post) => !isLongForm(post)
      && post.platforms.includes("LinkedIn")
      && new Date(post.date) >= oneYearAgo,
  );
  expect(Number.isFinite(Date.parse(writingFeed.refreshedAt))).toBe(true);
  expect(expectedLinkedInPosts.length).toBeGreaterThan(0);
  const expectedMicroPosts = writingFeed.posts
    .filter((post) => post.platforms.includes("Micro.blog"))
    .slice(0, 6);
  await page.goto("/blog/");
  await expect(
    page.getByRole("link", { name: "Micro.blog is my blog" }),
  ).toHaveAttribute("href", "https://oliverames.micro.blog/");
  await expect(page.locator(".social-card")).toHaveCount(
    expectedMicroPosts.length + expectedLinkedInPosts.length,
  );
  await expect(page.getByRole("group", { name: "Post media, 1 item" }).first()).toBeVisible();
  await expect(page.getByRole("group", { name: "Post media, 1 items" })).toHaveCount(0);
  if (test.info().config.metadata?.siteRoot === "_site") {
    await expect(page.locator(".social-card__avatar").first()).toHaveAttribute("sizes", "3rem");
    await expect(page.locator(".social-card__media-item img").first()).toHaveAttribute(
      "sizes",
      "(max-width: 42rem) 71vw, (max-width: 75rem) 44vw, 30rem",
    );
  }
  const writingProfiles = page.getByLabel("Writing profiles");
  await expect(
    writingProfiles.getByRole("link", { name: "Threads", exact: true }),
  ).toBeVisible();
  await page.goto("/blog/archive/");
  await expect(page.locator(".social-card")).toHaveCount(writingFeed.posts.length);
  await page.goto("/blog/");
  await expect(
    writingProfiles.getByRole("link", { name: "Instagram", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "LinkedIn posts from the past year" })).toBeVisible();
  const linkedInCards = page.locator(".writing-stream--social .social-card");
  await expect(linkedInCards).toHaveCount(expectedLinkedInPosts.length);
  for (const post of expectedLinkedInPosts) {
    const media = post.sharedPost?.media?.length
      ? post.sharedPost.media
      : post.media?.length
        ? post.media
        : post.image || post.localImage
          ? [{}]
          : [];
    const card = page.locator(`[data-post-id="${post.id}"]`);
    await expect(card.locator(".social-card__media-item")).toHaveCount(media.length);
  }
  await expect(linkedInCards.locator(".social-card__shared").first()).toContainText(
    "LGBTQ+ Vermonters deserve care that respects who they are",
  );
  await expect(
    page.locator('a[href="https://www.linkedin.com/feed/update/urn:li:activity:7460782290340843520/"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-post-id="linkedin:7440378580276203521"] .social-card__media-item img'),
  ).toBeVisible();
  const serviceCallCard = page.locator(
    '.writing-stream--articles .social-card:has-text("How I used AI to find what two service calls missed")',
  );
  await expect(serviceCallCard.locator(".social-card__media")).toHaveAttribute(
    "src",
    /62df03f05515\.webp$/,
  );
  await expect(serviceCallCard.locator(".social-card__media")).toHaveAttribute(
    "alt",
    /expansion valve assembly.*UPSTAIRS/,
  );
  const articleWithMedia = page
    .locator(".writing-stream--articles .social-card:has(.social-card__media)")
    .first();
  await expect(articleWithMedia.locator(".social-card__media")).toBeVisible();
  expect(await articleWithMedia.evaluate((card) => {
    const image = card.querySelector(".social-card__media");
    const heading = card.querySelector("h2");
    return image.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING;
  })).toBeTruthy();
  await page.locator('.social-card:has-text("The Sunshine Trail") .social-card__read').click();
  await expect(page).toHaveURL(
    /\/blog\/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids\/$/,
  );
  await expect(page.locator(".writing-article__body p")).toHaveCount(9);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The Sunshine Trail",
  );
});

test("LinkedIn image posts scroll like carousels and open in the site viewer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/blog/");
  const card = page.locator('[data-post-id="linkedin:7493102298634776576"]');
  const track = card.getByRole("group", { name: "Post media, 12 items" });
  const items = track.locator(".social-card__media-item");
  const count = card.locator("[data-media-carousel-count]");
  const previous = card.getByRole("button", { name: "Show previous post image" });
  const next = card.getByRole("button", { name: "Show next post image" });

  await expect(items).toHaveCount(12);
  await expect(count).toHaveText("1/12");
  await expect(previous).toBeDisabled();
  await expect(next).toHaveAttribute("aria-controls", await track.getAttribute("id"));
  expect(await track.evaluate((element) => {
    const trackBox = element.getBoundingClientRect();
    const secondBox = element.children[1].getBoundingClientRect();
    return secondBox.left < trackBox.right && secondBox.right > trackBox.left;
  })).toBe(true);

  await items.first().locator("img").click();
  await expect(page.locator("#image-viewer")).toBeVisible();
  await expect(page.locator("#image-viewer-caption")).toContainText("1 of 12");
  await page.locator("#image-viewer-close").click();

  for (let index = 2; index <= 10; index += 1) {
    await next.click();
    await expect(count).toHaveText(`${index}/12`);
  }
  await next.click();
  await expect(count).toHaveText("12/12");
  await expect(next).toBeDisabled();
  expect(await items.last().evaluate((item) => {
    const trackElement = item.parentElement;
    const itemBox = item.getBoundingClientRect();
    const trackBox = trackElement.getBoundingClientRect();
    return itemBox.left >= trackBox.left && itemBox.right <= trackBox.right;
  })).toBe(true);

  const twoImageCard = page.locator('[data-post-id="linkedin:7396253468706971648"]');
  await twoImageCard.scrollIntoViewIfNeeded();
  const twoImageTrack = twoImageCard.getByRole("group", { name: "Post media, 2 items" });
  await expect(twoImageTrack.locator(".social-card__media-item")).toHaveCount(2);
  await expect(twoImageCard.locator("[data-media-carousel-count]")).toBeHidden();
  await expect(twoImageCard.getByRole("button", { name: "Show previous post image" })).toBeHidden();
  await expect(twoImageCard.getByRole("button", { name: "Show next post image" })).toBeHidden();
});

test("in-house campaign cards identify the correct organization and role", async ({ page }) => {
  await page.goto("/work/");
  await expect(page.locator(".work-category__framing")).toContainText(
    "These include in-house projects at EastRise Credit Union and BETA Technologies, plus commissioned work. Each card names the organization and my role.",
  );
  await expect(page.locator('[data-organization="eastrise"] .work-item__credit').first()).toHaveText("Made as Digital Content Strategist, EastRise Credit Union.");
  await expect(
    page.locator('a[href="eastrise-photography/#smokin-somethin-bbq-title"] .work-item__context'),
  ).toContainText("1 photograph");
  const flightPathsCard = page.locator('.work-item[href="flight-paths/"]');
  await expect(flightPathsCard).toHaveAttribute("data-organization", "beta-technologies");
  await expect(flightPathsCard.locator('img[src="../assets/images/work/campaigns/flight-paths.webp"]')).toHaveCount(1);
  await expect(
    page.locator('.work-filters [data-work-filter="beta-technologies"]'),
  ).toHaveText("BETA");
  await expect(
    page.locator('.work-filters [data-work-filter="blue-cross-vermont"]'),
  ).toHaveCount(0);

  await page.goto("/work/?organization=beta-technologies");
  await expect(page.locator("#project-list-title")).toHaveText("BETA Technologies projects");
  await expect(page.locator(".work-filter-status")).toHaveText("1 project. Show all work");
  await expect(
    page.locator('.work-filters [data-work-filter="beta-technologies"]'),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".work-list > .work-item:not([hidden])")).toHaveCount(1);
  await expect(page.locator('.work-list > .work-item:not([hidden])')).toHaveAttribute(
    "href",
    "flight-paths/",
  );

  for (const organization of [
    "beta-technologies",
    "eastrise",
    "green-mountain-community-fitness",
  ]) {
    await page.goto(`/work/?organization=${organization}`);
    const categoryStates = await page.locator(".work-category").evaluateAll((categories) => (
      categories.map((category) => ({
        hidden: category.hidden,
        visibleCards: category.querySelectorAll(".work-item:not([hidden])").length,
      }))
    ));
    expect(categoryStates.some(({ hidden }) => !hidden)).toBe(true);
    expect(
      categoryStates.every(({ hidden, visibleCards }) => hidden || visibleCards > 0),
    ).toBe(true);
  }
});

test("campaign pages disclose tracked public image sources automatically", async ({ page }) => {
  await page.goto("/work/eastrise-social/");
  const disclosures = page.locator(".asset-provenance li");
  const galleryImageCount = await page.locator('[data-gallery="eastrise-social"] img').count();
  await expect(disclosures).toHaveCount(galleryImageCount);
  await expect(page.locator(".asset-provenance li a")).toHaveCount(galleryImageCount);
  const disclosedImageCount = (await disclosures.allTextContents()).reduce((total, text) => {
    const count = Number(text.match(/^(\d+) images?/)?.[1] || 0);
    return total + count;
  }, 0);
  expect(disclosedImageCount).toBe(galleryImageCount);
  for (const disclosure of await disclosures.all()) {
    await expect(disclosure).toContainText("Retrieved July 29, 2026.");
  }
});

test("photo project cards scrub galleries horizontally and restore their pinned image", async ({
  page,
}) => {
  await page.goto("/work/");
  const card = page.locator('a.work-item[href="drone-photography/"]');
  const image = card.locator("img").first();
  const pinnedSource = await image.getAttribute("src");
  await image.scrollIntoViewIfNeeded();
  const box = await image.boundingBox();

  expect(box).not.toBeNull();
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await expect(image).toHaveAttribute("data-gallery-scrub-ready", "");
  await page.mouse.move(box.x + 220, box.y + box.height / 2, { steps: 8 });
  await expect.poll(() => image.getAttribute("src")).not.toBe(pinnedSource);

  await page.mouse.move(0, 0);
  await expect(image).toHaveAttribute("src", pinnedSource);
});

test("software project cards do not scrub their preview images", async ({ page }) => {
  await page.goto("/work/");
  const card = page.locator("#software-development .software-card").first();
  const image = card.locator("img").first();
  const pinnedSource = await image.getAttribute("src");
  await image.scrollIntoViewIfNeeded();
  const box = await image.boundingBox();

  expect(box).not.toBeNull();
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2, { steps: 8 });
  await expect(image).toHaveAttribute("src", pinnedSource);
});

test("home separates recent client and employer projects from software", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recent projects" })).toBeVisible();
  await expect(page.locator(".home-paths .path-thumb")).not.toHaveCount(0);
  await expect(page.locator('.home-paths a[href*="ping-warden"], .home-paths a[href*="apple-core"], .home-paths a[href*="bridgeport"]')).toHaveCount(0);
  const softwareCards = page.locator(".home-software .software-card");
  await expect(softwareCards).toHaveCount(4);
  expect(await softwareCards.evaluateAll((cards) => cards.map((card) => card.getAttribute("href")))).toEqual([
    "work/ping-warden/",
    "work/meta-mcp-server/",
    "work/ynab-mcp-server/",
    "work/skylight-bridge/",
  ]);
  await expect(page.locator('.home-software a[href="work/apple-core/"], .home-software a[href="work/bridgeport/"]')).toHaveCount(0);
  await expect(page.locator('.home-software a[href="work/ping-warden/"] .software-visual img')).toHaveAttribute(
    "src",
    "assets/images/work/software/ping-warden-dashboard.webp",
  );
  await expect(page.locator('.home-software a[href="work/skylight-bridge/"] .software-visual img')).toHaveAttribute(
    "src",
    "assets/images/work/software/skylight-bridge-overview.webp",
  );
  await expect(page.locator(".home-testimonial")).toHaveCount(2);
});

test("about previews testimonials and links to the complete archive", async ({ page }) => {
  await page.goto("/about/");

  await expect(page.locator(".about-testimonials .testimonial-card")).toHaveCount(2);
  await expect(page.getByRole("link", { name: /view more testimonials/i })).toHaveAttribute("href", "../testimonials/");
});

test("testimonials remains visible in the testimonials page navigation", async ({ page }) => {
  await page.goto("/testimonials/");

  await expect(page.locator('.site-nav a[href="../testimonials/"]')).toHaveAttribute("aria-current", "page");
});
