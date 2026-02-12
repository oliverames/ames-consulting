import { test, expect } from "@playwright/test";

/**
 * Tests verifying CSS loads correctly and all subpage navigation works.
 * These were created after fixing absolute paths (e.g., /assets/css/main.css)
 * to relative paths so the site works both on custom domains and GitHub Pages
 * subdirectory deployments (oliverames.github.io/ames-consulting/).
 */

const ALL_ROUTES = [
  "/",
  "/blog/",
  "/work/",
  "/work/bcbs-vt-app/",
  "/work/sunshine-trail/",
  "/contact/",
  "/likes/",
  "/colophon/"
];

// -- CSS Loading --

for (const route of ALL_ROUTES) {
  test(`CSS stylesheet is loaded and applied on ${route}`, async ({ page }) => {
    const cssResponses = [];
    page.on("response", (response) => {
      if (response.url().includes("main.css")) {
        cssResponses.push(response);
      }
    });

    await page.goto(route);

    // Verify the CSS file was fetched successfully (200 OK)
    expect(cssResponses.length, `main.css should be requested on ${route}`).toBeGreaterThan(0);
    expect(cssResponses[0].status()).toBe(200);

    // Verify CSS is actually applied: body should have the design system background color
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // The Ames design system uses #faf8f5 (rgb(250, 248, 245)) in light mode
    // or #1c2929 (rgb(28, 41, 41)) in dark mode
    const isLightMode = bgColor === "rgb(250, 248, 245)";
    const isDarkMode = bgColor === "rgb(28, 41, 41)";
    expect(
      isLightMode || isDarkMode,
      `Body background on ${route} should be design system color, got: ${bgColor}`
    ).toBe(true);
  });
}

// -- Typography / Design Tokens --

test("headings use Barlow Condensed font family", async ({ page }) => {
  await page.goto("/");

  const h1Font = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return h1 ? getComputedStyle(h1).fontFamily : "";
  });

  expect(h1Font.toLowerCase()).toContain("barlow condensed");
});

test("body text uses Lora font family", async ({ page }) => {
  await page.goto("/");

  const bodyFont = await page.evaluate(() =>
    getComputedStyle(document.body).fontFamily
  );

  expect(bodyFont.toLowerCase()).toContain("lora");
});

test("accent color token is applied to links", async ({ page }) => {
  await page.goto("/");

  const linkColor = await page.evaluate(() => {
    const accentLink = document.querySelector(".site-directory a");
    return accentLink ? getComputedStyle(accentLink).color : "";
  });

  // Heritage Gold #f5a542 = rgb(245, 165, 66) or Display P3 equivalent
  const isHeritageGold =
    linkColor === "rgb(245, 165, 66)" ||
    linkColor.startsWith("color(display-p3");
  expect(isHeritageGold).toBe(true);
});

// -- Navigation Structure --

for (const route of ALL_ROUTES) {
  test(`page at ${route} has site header with nav links`, async ({ page }) => {
    await page.goto(route);

    const header = page.locator(".site-header");
    await expect(header).toBeVisible();

    const siteName = page.locator(".site-name");
    await expect(siteName).toBeVisible();
    await expect(siteName).toHaveText("ames.consulting");

    const nav = page.getByLabel("Primary");
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Work" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
  });
}

for (const route of ALL_ROUTES) {
  test(`page at ${route} has site footer with social links`, async ({ page }) => {
    await page.goto(route);

    const footer = page.locator(".site-footer");
    await expect(footer).toBeVisible();

    const footerLinks = footer.locator(".footer-links a");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
}

// -- Subpage Navigation (clicking links actually works) --

test("Home nav link navigates to home from every page", async ({ page }) => {
  for (const route of ["/blog/", "/work/", "/contact/"]) {
    await page.goto(route);
    await page.getByLabel("Primary").getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".intro h1")).toBeVisible();
  }
});

test("Work nav link navigates to work index", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Primary").getByRole("link", { name: "Work" }).click();
  await expect(page).toHaveURL(/\/work\/$/);
  await expect(page.locator(".page-header h1")).toHaveText("Work");
});

test("Blog nav link navigates to blog", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Primary").getByRole("link", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.locator(".page-header h1")).toHaveText("Blog");
});

test("Work index links to BCBS VT App detail page", async ({ page }) => {
  await page.goto("/work/");
  await page.locator(".work-item").filter({ hasText: "BCBS VT App" }).click();
  await expect(page).toHaveURL(/\/work\/bcbs-vt-app\/$/);
  await expect(page.locator("h1")).toHaveText("BCBS VT App");
});

test("Work index links to Sunshine Trail detail page", async ({ page }) => {
  await page.goto("/work/");
  await page.locator(".work-item").filter({ hasText: "Sunshine Trail" }).click();
  await expect(page).toHaveURL(/\/work\/sunshine-trail\/$/);
  await expect(page.locator("h1")).toHaveText("The Sunshine Trail");
});

test("BCBS VT App sibling nav links to Sunshine Trail", async ({ page }) => {
  await page.goto("/work/bcbs-vt-app/");
  await page.locator(".sibling-nav").getByRole("link", { name: "The Sunshine Trail" }).click();
  await expect(page).toHaveURL(/\/work\/sunshine-trail\/$/);
});

test("Sunshine Trail sibling nav links to BCBS VT App", async ({ page }) => {
  await page.goto("/work/sunshine-trail/");
  await page.locator(".sibling-nav").getByRole("link", { name: "BCBS VT App" }).click();
  await expect(page).toHaveURL(/\/work\/bcbs-vt-app\/$/);
});

test("site-name link navigates home from deep page", async ({ page }) => {
  await page.goto("/work/bcbs-vt-app/");
  await page.locator(".site-name").click();
  await expect(page).toHaveURL(/\/$/);
});

// -- Home Page Site Directory --

test("home page site directory has all section links", async ({ page }) => {
  await page.goto("/");

  const directory = page.locator(".site-directory");
  await expect(directory).toBeVisible();

  // Work links
  await expect(directory.getByRole("link", { name: "BCBS VT App" })).toBeVisible();
  await expect(directory.getByRole("link", { name: "The Sunshine Trail" })).toBeVisible();

  // About links
  await expect(directory.getByRole("link", { name: "Stuff I Like" })).toBeVisible();
  await expect(directory.getByRole("link", { name: "Colophon" })).toBeVisible();

  // Blog links
  await expect(directory.getByRole("link", { name: "All Posts" })).toBeVisible();
});

test("home page directory links navigate correctly", async ({ page }) => {
  await page.goto("/");

  // Test Stuff I Like link
  await page.locator(".site-directory").getByRole("link", { name: "Stuff I Like" }).click();
  await expect(page).toHaveURL(/\/likes\/$/);
  await expect(page.locator("h1")).toHaveText("Stuff I Like");

  await page.goBack();

  // Test Colophon link
  await page.locator(".site-directory").getByRole("link", { name: "Colophon" }).click();
  await expect(page).toHaveURL(/\/colophon\/$/);
  await expect(page.locator("h1")).toHaveText("Colophon");
});

// -- Work Page Images --

test("work index loads project thumbnail images", async ({ page }) => {
  const imageResponses = [];
  page.on("response", (response) => {
    if (response.url().includes("/assets/images/work/")) {
      imageResponses.push({ url: response.url(), status: response.status() });
    }
  });

  await page.goto("/work/");

  // Wait for images to be in DOM
  const images = page.locator(".work-item img");
  const imgCount = await images.count();
  expect(imgCount).toBeGreaterThanOrEqual(2);

  // Check BCBS hero image exists and has correct src
  const bcbsImg = images.filter({ hasText: /BCBS/ }).or(page.locator('img[alt*="BCBS"]'));
  await expect(bcbsImg.first()).toHaveAttribute("src", /bcbs-vt-app/);

  // Check Sunshine Trail hero image
  const trailImg = page.locator('img[alt*="Sunshine Trail"]');
  await expect(trailImg.first()).toHaveAttribute("src", /sunshine-trail/);
});

test("BCBS VT App detail page loads hero image", async ({ page }) => {
  await page.goto("/work/bcbs-vt-app/");

  const heroImg = page.locator(".project-hero img");
  await expect(heroImg).toBeVisible();
  await expect(heroImg).toHaveAttribute("src", /bcbs-vt-app\/hero\.png/);
});

test("Sunshine Trail detail page loads hero image", async ({ page }) => {
  await page.goto("/work/sunshine-trail/");

  const heroImg = page.locator(".project-hero img");
  await expect(heroImg).toBeVisible();
  await expect(heroImg).toHaveAttribute("src", /sunshine-trail\/hero\.jpg/);
});

// -- Likes / Colophon Sibling Navigation --

test("Likes page sibling nav links to Colophon", async ({ page }) => {
  await page.goto("/likes/");
  await page.locator(".sibling-nav").getByRole("link", { name: "Colophon" }).click();
  await expect(page).toHaveURL(/\/colophon\/$/);
});

test("Colophon page sibling nav links to Stuff I Like", async ({ page }) => {
  await page.goto("/colophon/");
  await page.locator(".sibling-nav").getByRole("link", { name: "Stuff I Like" }).click();
  await expect(page).toHaveURL(/\/likes\/$/);
});

// -- Nav Contact Link --

test("nav Contact link navigates to contact page", async ({ page }) => {
  await page.goto("/");
  await page.locator(".site-nav a", { hasText: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator("h1")).toHaveText("Contact");
});

// -- No Broken Internal Links (comprehensive) --

test("all internal links on home page resolve without 404", async ({ page }) => {
  await page.goto("/");

  const links = await page.evaluate(() => {
    return [...document.querySelectorAll("a[href]")]
      .map((a) => a.href)
      .filter((href) => href.startsWith(window.location.origin));
  });

  const uniqueLinks = [...new Set(links)];
  expect(uniqueLinks.length).toBeGreaterThan(0);

  for (const link of uniqueLinks) {
    const response = await page.request.get(link);
    expect(
      response.status(),
      `Link ${link} should not be 404`
    ).not.toBe(404);
  }
});

// -- Home Page Path Cards (Work Previews) --

test("home page work path cards link to project detail pages", async ({ page }) => {
  await page.goto("/");

  const bcbsCard = page.locator('.path-card[href*="bcbs-vt-app"]');
  await expect(bcbsCard).toBeVisible();

  const trailCard = page.locator('.path-card[href*="sunshine-trail"]');
  await expect(trailCard).toBeVisible();

  // Click BCBS card and verify navigation
  await bcbsCard.click();
  await expect(page).toHaveURL(/\/work\/bcbs-vt-app\/$/);
});

// -- Layout Verification --

for (const route of ALL_ROUTES) {
  test(`page at ${route} has box-sizing border-box applied`, async ({ page }) => {
    await page.goto(route);

    const boxSizing = await page.evaluate(() =>
      getComputedStyle(document.body).boxSizing
    );
    expect(boxSizing).toBe("border-box");
  });
}

test("body margin is reset to 0", async ({ page }) => {
  await page.goto("/");

  const margin = await page.evaluate(() =>
    getComputedStyle(document.body).margin
  );
  expect(margin).toBe("0px");
});
