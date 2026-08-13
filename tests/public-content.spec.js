import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PUBLIC_HTML_FILES,
  WITHHELD_ASSET_PREFIXES,
  WITHHELD_ROUTE_PREFIXES,
} from "../scripts/publication-policy.mjs";

const root = process.cwd();
const read = (relativePath) => {
  const configuredRoot = test.info().config.metadata?.siteRoot || ".";
  return readFile(join(root, configuredRoot, relativePath), "utf8");
};
const readSource = (relativePath) => readFile(join(root, relativePath), "utf8");

test("public testimonials omit private performance-review material", async () => {
  const html = await read("testimonials/index.html");

  expect(html).toContain('<p class="eyebrow">LinkedIn recommendations</p>');
  expect(html).toContain('id="recommendation-dialog"');
  expect(html).toContain("assets/js/recommendation-dialog.js");
  expect(html).not.toContain("<details>");
  expect(html).not.toMatch(/performance review|performance feedback/i);
  expect(html).not.toContain("Jevonne McLaughlin");
});

test("writing feed contains the complete verified past-year LinkedIn set", async () => {
  const feed = JSON.parse(await readSource("assets/data/writing-feed.json"));
  const expectedActivityIds = [
    "7467314005167054848",
    "7460836075540799489",
    "7460782290340843520",
    "7460781094884421632",
    "7455326793370320897",
    "7450594949588316160",
    "7443387205353504768",
    "7440378580276203521",
    "7439306853655707650",
    "7427369442927341568",
    "7424637123200221184",
    "7422289170049523714",
    "7407619780834246657",
    "7397604744460025856",
    "7396613980082950144",
    "7396253468706971648",
    "7392623143162650626",
    "7392295981154836481",
    "7391846002045128705",
    "7391841822555414528",
    "7389730138382422016",
  ];
  const linkedinPosts = feed.posts.filter((post) => post.platforms.includes("LinkedIn"));
  const activityIds = linkedinPosts.map((post) => post.id.replace(/^linkedin:/, ""));

  expect(activityIds).toEqual(expectedActivityIds);
  expect(new Set(activityIds).size).toBe(expectedActivityIds.length);
  for (const post of linkedinPosts) {
    expect(post.text.trim().length).toBeGreaterThan(0);
    expect(new Date(post.date).getTime()).toBeGreaterThanOrEqual(
      new Date("2025-08-11T00:00:00-04:00").getTime(),
    );
    expect(post.links).toContainEqual({
      platform: "LinkedIn",
      url: `https://www.linkedin.com/feed/update/urn:li:activity:${post.id.replace(/^linkedin:/, "")}/`,
    });
  }
});

test("Fairbanks pages use the public Guinness record instead of internal revenue", async () => {
  const pages = await Promise.all([
    read("about/index.html"),
    read("work/index.html"),
    read("work/fairbanks-planetarium/index.html"),
  ]);

  for (const html of pages) {
    expect(html).not.toMatch(/134\.8%|\$13,359\.80|\$31,363\.40|planetarium revenue/i);
  }
  expect(pages[2]).toContain("1,580 people");
  expect(pages[2]).toContain("Guinness World Records");
});

test("contact form names the services that process an inquiry", async () => {
  const html = await read("contact/index.html");
  const aboutHtml = await read("about/index.html");

  expect(html).toContain("Cloudflare Turnstile checks this form for spam");
  expect(html).toContain("Resend delivers your message by email");
  expect(html).toContain("I use your contact details and message to reply to your inquiry");
  expect(html).toContain("This form needs JavaScript for spam protection");
  expect(html).toContain('href="mailto:oliver@ames.consulting"');
  expect(html.match(/<!--email_off-->/g)).toHaveLength(2);
  expect(html.match(/<!--\/email_off-->/g)).toHaveLength(2);
  expect(aboutHtml).toContain(
    '<!--email_off--><a href="mailto:oliver@ames.consulting">oliver@ames.consulting</a><!--/email_off-->',
  );
});

test("contact form fallback gives visitors a direct alternative", async () => {
  const source = await read("assets/js/contact-form.js");

  expect(source).toContain("The form is unavailable right now. Please email me at oliver@ames.consulting.");
  expect(source).not.toContain("Add contactFormEndpoint in site.config.json");
});

test("service breadcrumbs include the published services index", async () => {
  const html = await read("services/photography-and-video/index.html");
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const graphs = scripts.map((match) => JSON.parse(match[1]));
  const breadcrumb = graphs
    .flatMap((data) => data["@graph"] || [])
    .find((item) => item["@type"] === "BreadcrumbList");

  expect(breadcrumb).toBeTruthy();
  expect(breadcrumb.itemListElement.map((item) => item.item)).toEqual([
    "https://ames.consulting/",
    "https://ames.consulting/services/",
    "https://ames.consulting/services/photography-and-video/",
  ]);
});

test("retired routes and asset prefixes are absent from the public artifact", async ({ request }) => {
  const retiredPaths = [
    "/work/beta-andrew/",
    "/work/beta-emma/",
    "/work/beta-ethan/",
    "/assets/images/work/events/beta-andrew/dsc08015.webp",
    "/assets/images/work/events/beta-emma/dsc07894.webp",
    "/assets/images/work/events/beta-ethan/dsc08105.webp",
    "/assets/images/work/eastrise/photography/_unassigned-public-assets/people-and-portraits/2024-10-15_16-42-38_UTC_DBJuJuUpFzc-0aff11d03784.webp",
  ];

  for (const retiredPath of retiredPaths) {
    const response = await request.get(retiredPath, { failOnStatusCode: false });
    expect(response.status(), retiredPath).toBe(404);
  }
});

test("withheld Blue Cross galleries remain intact and noindexed in source", async () => {
  for (const routePrefix of WITHHELD_ROUTE_PREFIXES) {
    const html = await readSource(`${routePrefix}index.html`);
    expect(html, routePrefix).toMatch(
      /<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i,
    );
    expect(html, routePrefix).toContain("<img");
  }
});

test("withheld Blue Cross galleries and images are absent from the built artifact", async ({ request }) => {
  test.skip(
    test.info().config.metadata?.siteRoot !== "_site",
    "The source server intentionally retains withheld galleries.",
  );

  const assetSamples = new Map([
    ["assets/images/work/blue-cross/", "arrayrx-card.webp"],
    ["assets/images/work/events/arrayrx-press-conference-2026/", "dsc02517.webp"],
    ["assets/images/work/events/be-well-at-work-2026/", "dsc03152.webp"],
    ["assets/images/work/events/corporate-cup-2026/", "dsc03213.webp"],
    ["assets/images/work/events/girls-on-the-run-2026/", "dsc03810.webp"],
    ["assets/images/work/events/senior-games-press-event-2026/", "dsc01867.webp"],
    ["assets/images/work/events/walk-at-lunch-and-green-up-2026/", "dsc02728.webp"],
    ["assets/images/work/portraits/gallery/blue-cross/", "beth-roberts-executive.webp"],
  ]);
  const withheldPaths = [
    ...WITHHELD_ROUTE_PREFIXES,
    ...WITHHELD_ASSET_PREFIXES.map((prefix) => prefix.endsWith(".webp")
      ? prefix
      : `${prefix}${assetSamples.get(prefix)}`),
  ];

  for (const withheldPath of withheldPaths) {
    const response = await request.get(`/${withheldPath}`, { failOnStatusCode: false });
    expect(response.status(), withheldPath).toBe(404);
  }

  expect((await request.get("/work/flight-paths/")).status()).toBe(200);
  expect((await request.get("/work/beta-technologies/")).status()).toBe(200);
  for (const route of [
    "/work/london-2019/",
    "/work/vermont-foodbank-volunteer-day-2026/",
    "/work/whale-dance-randolph/",
    "/work/drone-photography/",
  ]) {
    expect((await request.get(route)).status(), route).toBe(200);
  }
});

test("public work cards include the requested galleries without withheld Blue Cross cards", async () => {
  const html = await read("work/index.html");
  const workItems = [...html.matchAll(/<a class="work-item"(?=[\s>])[\s\S]*?<\/a\s*>/g)]
    .map((match) => match[0]);
  const workItemHrefs = workItems.map(
    (workItem) => workItem.match(/\bhref="([^"]+)"/)?.[1],
  );

  for (const href of [
    "flight-paths/",
    "london-2019/",
    "vermont-foodbank-volunteer-day-2026/",
    "whale-dance-randolph/",
    "drone-photography/",
    "wheels-for-warmth/",
    "taylor-hoar-racing/",
  ]) {
    expect(workItemHrefs.filter((value) => value === href), href).toHaveLength(1);
  }

  expect(workItemHrefs).not.toContain(
    "eastrise-photography/#wheels-for-warmth-2024-title",
  );
  expect(workItemHrefs).not.toContain(
    "eastrise-photography/#veggievango-taylor-hoar-title",
  );

  for (const routePrefix of WITHHELD_ROUTE_PREFIXES) {
    const href = routePrefix.replace(/^work\//, "");
    expect(workItemHrefs, routePrefix).not.toContain(href);
  }
  expect(workItemHrefs.filter((href) => href.startsWith("beta-"))).toEqual([]);

  const flightPathsCards = workItems.filter((workItem) => (
    /\bhref="flight-paths\/"/.test(workItem)
  ));
  expect(flightPathsCards).toHaveLength(1);
  expect(flightPathsCards[0]).toContain('data-organization="beta-technologies"');
  expect(flightPathsCards[0]).not.toContain("<img");
  expect(flightPathsCards[0]).not.toContain("<iframe");

  const blueCrossMediaCards = workItems.filter((workItem) => (
    workItem.includes('data-organization="blue-cross-vermont"')
      && /<(?:img|iframe)\b/.test(workItem)
  ));
  expect(blueCrossMediaCards).toEqual([]);
});

test("public documents do not link to withheld Blue Cross routes or images", async () => {
  for (const relativePath of PUBLIC_HTML_FILES) {
    const html = await read(relativePath);
    for (const routePrefix of WITHHELD_ROUTE_PREFIXES) {
      const routeSlug = `${routePrefix.split("/")[1]}/`;
      expect(html, `${relativePath} references ${routeSlug}`).not.toContain(routeSlug);
    }
    for (const assetPrefix of WITHHELD_ASSET_PREFIXES) {
      expect(html, `${relativePath} references ${assetPrefix}`).not.toContain(assetPrefix);
    }
  }
});

test("Flight Paths is the only BETA media and uses YouTube privacy mode", async () => {
  const flightPaths = await read("work/flight-paths/index.html");
  expect(flightPaths.match(/<iframe\b/g) || []).toHaveLength(1);
  expect(flightPaths).toContain(
    'src="https://www.youtube-nocookie.com/embed/4r5N5DjmSCU"',
  );
  expect(flightPaths).not.toContain("<img");
  expect(flightPaths).not.toContain("data-gallery=");

  const betaLanding = await read("work/beta-technologies/index.html");
  expect(betaLanding).not.toContain("<iframe");
  expect(betaLanding).not.toContain("<img");
  expect(betaLanding).not.toContain("data-gallery=");
  expect(betaLanding.match(/href="\.\.\/flight-paths\/"/g) || []).toHaveLength(1);

  const blueCrossLanding = await read("work/blue-cross-vermont/index.html");
  expect(blueCrossLanding).not.toContain("Flight Paths");
  expect(blueCrossLanding).not.toContain("<img");
  expect(blueCrossLanding).not.toContain("<iframe");
});

test("EastRise campaign pages consolidate their related public photography", async () => {
  const photography = JSON.parse(
    await readSource("assets/data/eastrise-photography.json"),
  );
  const seriesCount = (slug) => photography.series.find(
    (series) => series.slug === slug,
  ).images.length;

  const wheels = await read("work/wheels-for-warmth/index.html");
  expect(wheels.match(/<img\b/g) || []).toHaveLength(
    seriesCount("wheels-for-warmth-2024"),
  );
  expect(wheels).toContain("65,906");
  expect(wheels).toContain("274");

  const taylor = await read("work/taylor-hoar-racing/index.html");
  expect(taylor.match(/<img\b/g) || []).toHaveLength(
    seriesCount("taylor-hoar-racing")
      + seriesCount("veggievango-taylor-hoar"),
  );
  expect(taylor).not.toContain("<h1>Taylor Hoar Racing 2025</h1>");
});

test("every public document declares the shared OA favicon", async ({ request }) => {
  for (const relativePath of PUBLIC_HTML_FILES) {
    const html = await read(relativePath);
    expect(html, relativePath).toMatch(/<link rel="icon" href="[^"]*assets\/images\/brand\/oa-social-mark\.svg" type="image\/svg\+xml">/);
  }

  const response = await request.get("/assets/images/brand/oa-social-mark.svg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});
