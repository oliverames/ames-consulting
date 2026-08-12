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

  const launcher = page.getByRole("button", { name: "Start a project" });
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

test("homepage proof tooltips stay inside the hero", async ({ page }) => {
  for (const { width, indexes } of [
    { width: 900, indexes: [3] },
    { width: 390, indexes: [1, 3] },
    { width: 320, indexes: [1, 3] },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const links = page.locator(".proof__page.is-visible .proof__link");
    for (const index of indexes) {
      const link = links.nth(index);
      const source = link.locator(".proof__source");
      await link.hover();
      await expect(source).toBeVisible();

      const bounds = await page.evaluate(
        ({ linkIndex }) => {
          const hero = document.querySelector(".hero").getBoundingClientRect();
          const tooltip = document
            .querySelectorAll(".proof__page.is-visible .proof__source")
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
  expect(layout.pageHeaderPaddingTop).toBeGreaterThanOrEqual(48);
  expect(layout.pageHeaderGap).toBeGreaterThanOrEqual(10);

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
  expect(contactSpacing).toBeGreaterThanOrEqual(18);
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
