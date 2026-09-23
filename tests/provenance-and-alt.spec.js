import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const escapeAttribute = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const readPublic = (relativePath) => {
  const configuredRoot = test.info().config.metadata?.siteRoot || ".";
  return readFile(join(root, configuredRoot, relativePath), "utf8");
};
const readSource = (relativePath) => readFile(join(root, relativePath), "utf8");

test("public provenance keeps distinct sources and removes tracking parameters", async () => {
  for (const route of [
    "work/giron-family/index.html",
    "work/neg-ecp-conference-2026/index.html",
    "work/sweat-heart-throwdown/index.html",
    "work/vermont-foodbank-volunteer-day-2026/index.html",
  ]) {
    const html = await readPublic(route);
    const disclosure = html.match(/<footer class="asset-provenance"[\s\S]*?<\/footer>/)?.[0] || "";

    expect(disclosure, route).not.toBe("");
    expect(disclosure, route).not.toMatch(/(?:utm_[a-z]+|[?&](?:amp;)?rcm=)/i);
    expect(disclosure, route).not.toContain("repository");
    expect(html, route).not.toContain("Private RAW");
    expect(disclosure, route).not.toMatch(/\b1 image were\b/);
  }
});

function expectEventGalleryDescriptions(campaign, html, { expectFeaturedHero = true } = {}) {
  for (const image of campaign.images) {
    const description = escapeAttribute(image.alt);
    expect(description.length).toBeGreaterThan(0);
    expect(html).toContain(`alt="${description}" aria-label="Open larger image: ${description}"`);
  }
  expect(html).not.toMatch(/aria-label="Open photograph \d+/);
  if (campaign.featuredFile && expectFeaturedHero) {
    const featuredImage = campaign.images.find(
      (image) => image.src.endsWith(`/${campaign.featuredFile}`),
    );
    expect(featuredImage).toBeTruthy();
    expect(html).toContain(`src="${featuredImage.src}" alt="${escapeAttribute(campaign.featuredAlt || campaign.title)}" width="${featuredImage.width}" height="${featuredImage.height}" loading="eager" fetchpriority="high" decoding="async" data-no-zoom`);
  }
}

test("every published event gallery renders scene-level descriptions", async () => {
  const data = JSON.parse(await readFile(join(root, "assets/data/event-galleries.json"), "utf8"));

  for (const campaign of data.campaigns.filter((item) => item.published !== false)) {
    const html = await readPublic(`work/${campaign.projectSlug || campaign.slug}/index.html`);
    expectEventGalleryDescriptions(campaign, html, {
      expectFeaturedHero: !campaign.projectSlug || campaign.slug === "giron-family-fall-2025",
    });
  }
});

test("NEG-ECP client work has explicit portfolio-rights provenance", async () => {
  const data = JSON.parse(await readFile(join(root, "assets/data/event-galleries.json"), "utf8"));
  const provenance = JSON.parse(await readFile(join(root, "assets/data/media-provenance.json"), "utf8"));
  const campaign = data.campaigns.find((item) => item.slug === "neg-ecp-conference-2026");
  const html = await readPublic("work/neg-ecp-conference-2026/index.html");

  expect(campaign?.images).toHaveLength(35);
  expect(html).toContain("35 images were made by Oliver Ames for Cynosure, Inc. and GBIC. Portfolio use is retained under the project agreement.");
  expect(html).not.toContain("36 images");
  expect(html).not.toMatch(/client coordination|closed working sessions/i);
  for (const image of campaign.images) {
    const asset = image.src.replace(/^\.\.\/\.\.\//, "");
    const record = provenance.assets[asset];
    expect(record?.source_url, asset).toBe("");
    expect(record?.source_channel, asset).toBe("");
    expect(record?.published_date, asset).toBe("");
    expect(record?.downloaded_date, asset).toBe("2026-08-11");
    expect(record?.credit, asset).toBe("Photographed by Oliver Ames for Cynosure, Inc. and GBIC");
    expect(record?.accepted_exception?.reason, asset).toBe("client_work_portfolio_rights");
    expect(record?.accepted_exception?.note, asset).not.toMatch(/client coordination|closed working sessions/i);
    expect(record?.archive_note, asset).toBe("was made by Oliver Ames for Cynosure, Inc. and GBIC. Portfolio use is retained under the project agreement.");
  }
});

test("withheld event gallery sources retain scene-level descriptions", async () => {
  const data = JSON.parse(await readFile(join(root, "assets/data/event-galleries.json"), "utf8"));

  for (const campaign of data.campaigns.filter((item) => item.published === false)) {
    const html = await readSource(`work/${campaign.slug}/index.html`);
    expect(html).toMatch(/<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i);
    expectEventGalleryDescriptions(campaign, html);
  }
});
