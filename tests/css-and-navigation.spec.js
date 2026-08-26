import { test, expect } from "@playwright/test";
import { PUBLIC_HTML_FILES } from "../scripts/publication-policy.mjs";

const publicRoutes = PUBLIC_HTML_FILES.map((filePath) => {
  if (filePath === "index.html") return "/";
  if (filePath === "404.html") return "/404.html";
  return `/${filePath.replace(/index\.html$/, "")}`;
});

test("brand stylesheet and primary navigation are active", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  expect(
    await heading.evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain("Barlow Condensed");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Work", exact: true }),
  ).toHaveAttribute("href", "./work/");
});

test("project launcher keeps readable contrast in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.evaluate(() =>
    scrollTo(0, document.documentElement.scrollHeight * 0.25),
  );

  const launcher = page.getByRole("button", { name: "Send me a note" });
  await expect(launcher).toBeVisible();
  const colors = await launcher.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, text: style.color };
  });

  expect(colors).toEqual({
    background: "rgb(28, 41, 41)",
    text: "rgb(250, 248, 245)",
  });
});

test("homepage section edges and practice calls to action align", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto("/");

  const layout = await page.evaluate(() => {
    const practiceHeading = document
      .querySelector(".practice-section > h2")
      .getBoundingClientRect();
    const testimonialHeading = document
      .querySelector(".home-testimonial .section-heading > h2")
      .getBoundingClientRect();
    const ctaTops = [...document.querySelectorAll(".practice-cta")].map(
      (element) => element.getBoundingClientRect().top,
    );

    return {
      ctaTops,
      practiceEdges: [
        document.querySelector(".practice-section").getBoundingClientRect().left,
        document.querySelector(".practice-section").getBoundingClientRect().right,
      ],
      testimonialEdges: [
        document.querySelector(".home-testimonial").getBoundingClientRect().left,
        document.querySelector(".home-testimonial").getBoundingClientRect().right,
      ],
      testimonialBorder: getComputedStyle(
        document.querySelector(".home-testimonial"),
      ).borderTopWidth,
      headingOffset: Math.abs(
        practiceHeading.left - testimonialHeading.left,
      ),
    };
  });

  expect(layout.ctaTops).toHaveLength(3);
  expect(Math.max(...layout.ctaTops) - Math.min(...layout.ctaTops)).toBeLessThan(
    1,
  );
  expect(layout.headingOffset).toBeLessThan(1);
  expect(layout.testimonialEdges).toEqual(layout.practiceEdges);
  expect(layout.testimonialBorder).toBe("0px");
});

test("homepage testimonial links stay clickable without underlines", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto("/");

  const links = page.locator(
    ".home-testimonial figcaption a:not(.testimonial-card__portrait-link), .home-testimonial .testimonial-card__more",
  );
  await expect(links).toHaveCount(6);
  expect(
    await links.evaluateAll((items) => items.map((item) => getComputedStyle(item).textDecorationLine)),
  ).toEqual(Array(6).fill("none"));

  for (const link of await links.all()) {
    await link.hover();
    await expect(link).toHaveCSS("text-decoration-line", "none");
  }
});

test("homepage software previews share one height", async ({ page }) => {
  for (const viewport of [
    { width: 1663, height: 1324 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const heights = await page.locator(".home-software .software-visual").evaluateAll(
      (previews) => previews.map((preview) => preview.getBoundingClientRect().height),
    );
    expect(heights).toHaveLength(4);
    expect(Math.max(...heights) - Math.min(...heights), `${viewport.width}px previews`).toBeLessThan(1);
  }
});

test("footer social profiles use one nonoverlapping list", async ({ page }) => {
  for (const viewport of [
    { width: 1663, height: 1324 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.locator(".site-footer__social").evaluate((list) => {
      const boxes = [...list.querySelectorAll("a")].map((link) => link.getBoundingClientRect());
      return {
        columns: getComputedStyle(list).gridTemplateColumns.split(" ").length,
        leftEdges: boxes.map((box) => box.left),
        overlaps: boxes.slice(1).some((box, index) => box.top < boxes[index].bottom - 1),
      };
    });
    expect(layout.columns, `${viewport.width}px columns`).toBe(1);
    expect(layout.leftEdges).toHaveLength(7);
    expect(Math.max(...layout.leftEdges) - Math.min(...layout.leftEdges)).toBeLessThan(1);
    expect(layout.overlaps).toBe(false);
  }
});

test("homepage sections use one vertical rhythm", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.evaluate(() => {
      const bounds = (selector) =>
        document.querySelector(selector).getBoundingClientRect();
      const hero = bounds(".hero");
      const practiceHeading = bounds(".practice-section > h2");
      const practiceGrid = bounds(".practice-grid");
      const firstTestimonialHeading = bounds(
        ".home-testimonial:not(.home-testimonial--secondary) .section-heading",
      );
      const firstTestimonialCard = bounds(
        ".home-testimonial:not(.home-testimonial--secondary) .testimonial-card",
      );
      const pathHeading = bounds(".path-row > h2");
      const pathBrowse = bounds(".path-browse");
      const secondTestimonialCard = bounds(
        ".home-testimonial--secondary .testimonial-card",
      );
      const software = bounds(".home-software");
      const footer = bounds(".site-footer");

      return {
        rhythm: Number.parseFloat(
          getComputedStyle(document.querySelector(".practice-section")).marginTop,
        ),
        gaps: [
          practiceHeading.top - hero.bottom,
          firstTestimonialHeading.top - practiceGrid.bottom,
          pathHeading.top - firstTestimonialCard.bottom,
          secondTestimonialCard.top - pathBrowse.bottom,
          software.top - secondTestimonialCard.bottom,
          footer.top - software.bottom,
        ],
      };
    });

    for (const gap of layout.gaps) {
      expect(Math.abs(gap - layout.rhythm)).toBeLessThan(1);
    }
  }
});

test("wide page sections align with their top blocks", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);

    await page.goto("/contact/");
    const contactWidths = await page.evaluate(() => [
      document.querySelector(".contact-hero").getBoundingClientRect().width,
      document.querySelector(".contact-workspace").getBoundingClientRect().width,
    ]);
    expect(Math.max(...contactWidths) - Math.min(...contactWidths)).toBeLessThan(1);

    await page.goto("/about/");
    const aboutWidths = await page.evaluate(() =>
      [...document.querySelector("main").children].map(
        (element) => element.getBoundingClientRect().width,
      ),
    );
    expect(Math.max(...aboutWidths) - Math.min(...aboutWidths)).toBeLessThan(1);
  }
});

test("work headings keep space before their content", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/work/");

    const gap = await page.evaluate(() => {
      const heading = document
        .querySelector(".work-category > h2")
        .getBoundingClientRect();
      const framing = document
        .querySelector(".work-category__framing")
        .getBoundingClientRect();
      return framing.top - heading.bottom;
    });

    expect(gap).toBeGreaterThanOrEqual(12);
  }
});

test("homepage proof tooltips stay inside the hero", async ({ page }) => {
  for (const { width, indexes } of [
    { width: 900, indexes: [3] },
    { width: 390, indexes: [1, 3] },
    { width: 320, indexes: [1, 3] },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const links = page.locator(".proof__page .proof__link");
    for (const index of indexes) {
      const link = links.nth(index);
      const source = link.locator(".proof__source");
      await link.hover();
      await expect(source).toBeVisible();

      const bounds = await page.evaluate(
        ({ linkIndex }) => {
          const hero = document.querySelector(".hero").getBoundingClientRect();
          const tooltip = document
            .querySelectorAll(".proof__page .proof__source")
            [linkIndex].getBoundingClientRect();
          return {
            heroLeft: hero.left,
            heroRight: hero.right,
            tooltipLeft: tooltip.left,
            tooltipRight: tooltip.right,
          };
        },
        { linkIndex: index },
      );

      expect(bounds.tooltipLeft).toBeGreaterThanOrEqual(bounds.heroLeft - 1);
      expect(bounds.tooltipRight).toBeLessThanOrEqual(bounds.heroRight + 1);
    }
  }
});

test("homepage hero copy width does not depend on portrait parse timing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1350, height: 940 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const widths = await page.locator(".hero h1").evaluate((heading) => {
    const portrait = document.querySelector(".hero__portrait");
    const originalWidth = heading.getBoundingClientRect().width;
    portrait.remove();
    const withoutPortraitWidth = heading.getBoundingClientRect().width;
    document.querySelector(".hero__inner").append(portrait);
    return { originalWidth, withoutPortraitWidth };
  });

  expect(Math.abs(widths.originalWidth - widths.withoutPortraitWidth)).toBeLessThan(
    1,
  );
});

test("homepage headline variants reserve a stable hero height", async ({ page }) => {
  const variants = [
    ["I photograph ", "people", " while they’re doing the work."],
    ["I photograph ", "people at work", ", at events, and in their communities."],
    ["I photograph ", "employees, customers, and volunteers", " for organizations."],
    ["I make ", "portrait and workplace photographs", " on location."],
    ["I photograph ", "portraits, events, and documentary projects", " across Vermont."],
  ];

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const heights = [];
    for (const variant of variants) {
      heights.push(await page.locator(".hero").evaluate(async (hero, [before, emphasis, after]) => {
        const heading = hero.querySelector("[data-hero-headline]");
        const em = document.createElement("em");
        em.textContent = emphasis;
        heading.replaceChildren(before, em, after);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return hero.getBoundingClientRect().height;
      }, variant));
    }
    expect(Math.max(...heights) - Math.min(...heights), `${width}px hero height`).toBeLessThan(1);
  }
});

test("homepage animated mesh respects motion preferences", async ({ browser }) => {
  const moving = await browser.newPage({ reducedMotion: "no-preference" });
  await moving.goto("/");
  await expect(moving.locator(".hero__mesh")).toHaveCSS(
    "animation-name",
    "hero-mesh-drift",
  );
  await moving.close();

  const still = await browser.newPage({ reducedMotion: "reduce" });
  await still.goto("/");
  await expect(still.locator(".hero__mesh")).toHaveCSS("animation-name", "none");
  await still.close();
});

test("all public content routes load", async ({ request }) => {
  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} should be published`).toBe(200);
  }
});

test("software development has a distinct project interface", async ({ page }) => {
  await page.goto("/work/");
  const section = page.locator("#software-development");
  await expect(section.getByRole("heading", { name: "Software for problems I kept running into." })).toBeVisible();
  await expect(section.locator(".software-card")).toHaveCount(6);
  await expect(section.getByRole("link", { name: /Ping Warden/ }).locator("img").first()).toHaveAttribute("src", /ping-warden-dashboard\.webp$/);
  await expect(section.getByRole("link", { name: /Skylight Bridge/ }).locator("img").first()).toHaveAttribute("src", /skylight-bridge-overview\.webp$/);
  await expect(section.getByText("200 tools", { exact: true })).toBeVisible();
  await expect(section.getByText("Read-only by default", { exact: true })).toBeVisible();
  await expect(section.getByText("77 tools", { exact: true })).toBeVisible();
  await expect(section.getByText("OAuth 2.1", { exact: true })).toBeVisible();

  await page.goto("/work/ping-warden/");
  await expect(page.getByRole("heading", { level: 1, name: "Ping Warden" })).toBeVisible();
  await expect(page.getByRole("link", { name: /View the repository/ })).toHaveAttribute("href", "https://github.com/oliverames/ping-warden");
});

test("software cards collapse to a single column on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work/");
  const cards = page.locator("#software-development .software-card");
  await expect(cards).toHaveCount(6);
  const boxes = await cards.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThan(2);
});

test("software project previews do not clip on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/work/apple-core/",
    "/work/bridgeport/",
    "/work/meta-mcp-server/",
    "/work/ping-warden/",
    "/work/skylight-bridge/",
    "/work/ynab-mcp-server/",
  ]) {
    await page.goto(route);
    const preview = page.locator(".software-hero .software-visual");
    await expect(preview).toBeVisible();
    expect(
      await preview.evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
      `${route} preview should fit its container`,
    ).toBe(true);
  }
});

test("software project actions use shared readable buttons", async ({ page }) => {
  for (const route of [
    "/work/apple-core/",
    "/work/bridgeport/",
    "/work/meta-mcp-server/",
    "/work/ping-warden/",
    "/work/skylight-bridge/",
    "/work/ynab-mcp-server/",
  ]) {
    await page.goto(route);
    const actions = page.locator(".software-actions .btn");
    await expect(actions).toHaveCount(2);
    const measurements = await actions.evaluateAll((links) => {
      const channels = (color) => {
        const canvas = new OffscreenCanvas(1, 1);
        const context = canvas.getContext("2d", { colorSpace: "srgb" });
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const luminance = (color) => {
        const linear = channels(color).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
      };
      const ratio = (foreground, background) => {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const heroBackground = getComputedStyle(links[0].closest(".software-hero")).backgroundColor;
      return links.map((link) => {
        const style = getComputedStyle(link);
        const background = style.backgroundColor === "rgba(0, 0, 0, 0)"
          ? heroBackground
          : style.backgroundColor;
        return {
          contrast: ratio(style.color, background),
          height: link.getBoundingClientRect().height,
          paddingInline: Number.parseFloat(style.paddingInlineStart),
        };
      });
    });
    for (const measurement of measurements) {
      expect(measurement.height, `${route} action height`).toBeGreaterThanOrEqual(44);
      expect(measurement.paddingInline, `${route} action padding`).toBeGreaterThanOrEqual(16);
      expect(measurement.contrast, `${route} action contrast`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("contact panels share padding and required fields keep visible errors", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/contact/");
    await expect(page.locator("#contact-form")).toBeVisible();
    const paddings = await page.evaluate(() => [
      Number.parseFloat(getComputedStyle(document.querySelector(".contact-form-card")).paddingTop),
      Number.parseFloat(getComputedStyle(document.querySelector(".contact-notes")).paddingTop),
    ]);
    expect(Math.abs(paddings[0] - paddings[1])).toBeLessThan(1);
  }

  await page.getByRole("button", { name: "Send message" }).click();
  for (const [field, error] of [
    ["#contact-name", "#contact-name-error"],
    ["#contact-email", "#contact-email-error"],
    ["#contact-message", "#contact-message-error"],
  ]) {
    await expect(page.locator(field)).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(error)).not.toBeEmpty();
    await expect(page.locator(error)).toBeVisible();
  }
  await page.locator("#contact-name").fill("Oliver");
  await page.locator("#contact-email").fill("oliver@example.com");
  await page.locator("#contact-message").fill("I need help with a project.");
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(page.locator(".contact-form__field-error:not(:empty)")).toHaveCount(0);
});

test("work cards, case heroes, and footer links use the shared geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/work/");
  const legacyStyles = await page.locator(".work-category--earlier .work-item").evaluateAll((cards) => cards.map((card) => {
    const style = getComputedStyle(card);
    return {
      background: style.backgroundColor,
      radius: Number.parseFloat(style.borderRadius),
      shadow: style.boxShadow,
    };
  }));
  expect(legacyStyles).toHaveLength(4);
  for (const style of legacyStyles) {
    expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.radius).toBeGreaterThanOrEqual(12);
    expect(style.shadow).not.toBe("none");
  }

  const targetHeights = await page.locator(".site-footer__sitemap a, .site-footer__social a").evaluateAll(
    (links) => links.map((link) => link.getBoundingClientRect().height),
  );
  expect(targetHeights.length).toBeGreaterThan(0);
  expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/work/connecticut-college/");
    const geometry = await page.evaluate(() => ({
      hero: document.querySelector(".case-hero").getBoundingClientRect().width,
      main: document.querySelector("main").getBoundingClientRect().width,
      titleSize: Number.parseFloat(getComputedStyle(document.querySelector(".case-hero h1")).fontSize),
    }));
    expect(Math.abs(geometry.hero - geometry.main)).toBeLessThan(1);
    expect(geometry.titleSize).toBeGreaterThanOrEqual(36);
  }
});

test("dialog close controls use the shared hover treatment", async ({ page }) => {
  await page.goto("/testimonials/");
  await page.locator("[data-recommendation-dialog]").first().click();
  const close = page.locator(".recommendation-dialog__close");
  const before = await close.evaluate((button) => getComputedStyle(button).backgroundColor);
  await close.hover();
  const after = await close.evaluate((button) => ({
    background: getComputedStyle(button).backgroundColor,
    transform: getComputedStyle(button).transform,
  }));
  expect(after.background).not.toBe(before);
  expect(after.transform).not.toBe("none");
});

test("small-screen navigation and page headers keep deliberate spacing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/");
  const layout = await page.evaluate(() => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const nav = document.querySelector(".site-nav");
    const pageHeader = document.querySelector(".page-header");
    return {
      headerHeight: header.height,
      navWrap: getComputedStyle(nav).flexWrap,
      pageHeaderPaddingTop: Number.parseFloat(getComputedStyle(pageHeader).paddingTop),
      pageHeaderGap: Number.parseFloat(getComputedStyle(pageHeader).rowGap),
    };
  });
  expect(layout.headerHeight).toBeLessThan(130);
  expect(layout.navWrap).toBe("nowrap");
  expect(layout.pageHeaderPaddingTop).toBeGreaterThanOrEqual(12);
  expect(layout.pageHeaderGap).toBeGreaterThanOrEqual(10);

  // Below 44rem the header surface is unconditional; assert it without
  // coupling to any card's scroll position.
  await expect(page.locator(".site-header")).toHaveCSS(
    "background-color",
    "rgb(237, 232, 224)",
  );

  await page.goto("/work/eastrise-portraits/");
  const caseHeroGap = await page
    .locator(".case-hero")
    .evaluate((hero) => Number.parseFloat(getComputedStyle(hero).rowGap));
  expect(caseHeroGap).toBeGreaterThanOrEqual(10);

  await page.goto("/contact/");
  const contactSpacing = await page.evaluate(() => {
    const header = document.querySelector(".site-header").getBoundingClientRect();
    const hero = document.querySelector(".contact-hero").getBoundingClientRect();
    return hero.top - header.bottom;
  });
  expect(contactSpacing).toBeGreaterThanOrEqual(12);
});

test("header gains its blurred surface only after content scrolls past the threshold", async ({
  page,
}) => {
  // Desktop widths exercise the scroll-dependent treatment; below 44rem the
  // header background is unconditional and covered by the small-screen test.
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/blog/");
  await page.evaluate(() => window.scrollTo(0, 0));
  const header = page.locator(".site-header");
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(header).not.toHaveAttribute("data-scrolled");

  // Scroll well past header-scroll's 10px threshold and let the transition
  // settle before asserting the scrolled surface color.
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(header).toHaveAttribute("data-scrolled", "");
  await expect(header).toHaveCSS(
    "background-color",
    "rgba(243, 240, 235, 0.85)",
  );
});

test("about summary paragraphs keep a readable gap", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about/");
    const gap = await page.locator(".about-intro-card > p:not(.eyebrow)").evaluateAll(
      (paragraphs) => {
        const first = paragraphs[0].getBoundingClientRect();
        const second = paragraphs[1].getBoundingClientRect();
        return second.top - first.bottom;
      },
    );
    expect(gap).toBeGreaterThanOrEqual(12);
  }
});

test("writing links stay unadorned and the first stream follows the profile header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/blog/");

  for (const selector of [
    ".writing-header > p a",
    ".writing-stream__more",
    ".social-card__read",
    ".social-card__sources a",
  ]) {
    const link = page.locator(selector).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveCSS("text-decoration-line", "none");
    await link.hover();
    await expect(link).toHaveCSS("text-decoration-line", "none");
  }

  const spacing = await page.evaluate(() => {
    const header = document.querySelector(".writing-header");
    const profiles = header.querySelector(".profile-links").getBoundingClientRect();
    const heading = document
      .querySelector(".writing-header + .writing-stream .writing-stream__heading")
      .getBoundingClientRect();
    return {
      gap: heading.top - profiles.bottom,
      paddingBottom: Number.parseFloat(getComputedStyle(header).paddingBottom),
    };
  });
  expect(spacing.gap).toBeLessThanOrEqual(spacing.paddingBottom + 2);
});

test("narrow mobile layouts wrap without horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const route of [
    "/",
    "/about/",
    "/work/",
    "/work/eastrise-photography/",
    "/work/eastrise-launch-campaign/",
    "/work/taylor-hoar-racing/",
    "/blog/",
    "/contact/",
  ]) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.pageWidth, route).toBe(dimensions.viewportWidth);
  }

  await page.goto("/about/");
  const aboutLayout = await page.evaluate(() => {
    const heading = document.querySelector(".about-hero h1").getBoundingClientRect();
    const credentials = document.querySelector(".about-credentials").getBoundingClientRect();
    const education = document.querySelector(".about-education").getBoundingClientRect();
    return {
      headingRight: heading.right,
      credentialsRight: credentials.right,
      educationRight: education.right,
      viewportWidth: innerWidth,
    };
  });
  expect(aboutLayout.headingRight).toBeLessThanOrEqual(aboutLayout.viewportWidth);
  expect(aboutLayout.credentialsRight).toBeLessThanOrEqual(aboutLayout.viewportWidth);
  expect(aboutLayout.educationRight).toBeLessThanOrEqual(aboutLayout.viewportWidth);
});

test("campaign pages use local images and YouTube embeds", async ({ page }) => {
  await page.goto("/work/member-banking-stories/");
  await expect(page.locator("main img")).toHaveCount(1);
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(
    11,
  );
});
