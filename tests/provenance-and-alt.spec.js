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

test("public portrait provenance covers every displayed Blue Cross portrait", async () => {
  const html = await readPublic("work/blue-cross-portraits/index.html");
  const disclosure = html.match(/<footer class="asset-provenance"[\s\S]*?<\/footer>/)?.[0] || "";
  const sourceLinks = [...disclosure.matchAll(/href="(https:\/\/www\.bluecrossvt\.org\/[^"]+)"/g)].map((match) => match[1]);

  expect(sourceLinks).toEqual([
    "https://www.bluecrossvt.org/beth-roberts",
    "https://www.bluecrossvt.org/barbara-demas",
    "https://www.bluecrossvt.org/ruth-greene",
    "https://www.bluecrossvt.org/rebecca-heintz",
    "https://www.bluecrossvt.org/margaret-pinello-white",
    "https://www.bluecrossvt.org/tom-weigel",
  ]);
  expect(disclosure).toContain("1 image was made by Oliver Ames for Blue Cross and Blue Shield of Vermont in 2026.");
  expect(disclosure.match(/<li>/g)).toHaveLength(7);
});

test("public provenance keeps distinct sources and removes tracking parameters", async () => {
  const html = await readPublic("work/eastrise-photography/index.html");
  const disclosure = html.match(/<footer class="asset-provenance"[\s\S]*?<\/footer>/)?.[0] || "";

  expect(disclosure).not.toMatch(/(?:utm_[a-z]+|[?&](?:amp;)?rcm=)/i);
  expect(disclosure).not.toContain("repository");
  expect(html).not.toContain("Private RAW");
  expect(disclosure).not.toContain("1 image were");
  expect(disclosure).toContain("1 image was published April 17, 2025, with credit to Oliver Ames.");
});

test("EastRise gallery alt text describes images instead of social captions", async () => {
  const data = JSON.parse(await readFile(join(root, "assets/data/eastrise-photography.json"), "utf8"));
  const alts = data.series.flatMap((series) => series.images.map((image) => image.alt));

  for (const alt of alts) {
    expect(alt).not.toMatch(/public photograph|@\w+/i);
    expect(alt).not.toMatch(/^(?:meet|stop by|we had|join us|swipe to see|thank you for voting)/i);
  }
  expect(Math.max(...alts.map((alt) => alt.length))).toBeLessThanOrEqual(180);
});

test("EastRise launch gallery keeps its descriptions without JavaScript", async () => {
  const html = await readPublic("work/eastrise-launch-campaign/index.html");
  const data = JSON.parse(await readFile(join(root, "assets/data/eastrise-photography.json"), "utf8"));
  const series = data.series.find((item) => item.slug === "eastrise-launch");

  expect(series?.images).toHaveLength(23);
  for (const image of series.images) {
    const description = escapeAttribute(image.alt);
    expect(html).toContain(`alt="${description}" aria-label="Open larger image: ${description}"`);
  }
  expect(html).not.toMatch(/aria-label="Open photograph \d+ of 23 from EastRise Launch Campaign"/);
});

test("every event gallery renders scene-level descriptions", async () => {
  const data = JSON.parse(await readFile(join(root, "assets/data/event-galleries.json"), "utf8"));

  for (const campaign of data.campaigns) {
    const html = await readPublic(`work/${campaign.slug}/index.html`);
    for (const image of campaign.images) {
      const description = escapeAttribute(image.alt);
      expect(description.length).toBeGreaterThan(0);
      expect(html).toContain(`alt="${description}" aria-label="Open larger image: ${description}"`);
    }
    expect(html).not.toMatch(/aria-label="Open photograph \d+/);
    if (campaign.featuredFile) {
      const featuredImage = campaign.images.find((image) => image.src.endsWith(`/${campaign.featuredFile}`));
      expect(featuredImage).toBeTruthy();
      expect(html).toContain(`src="${featuredImage.src}" alt="${escapeAttribute(campaign.featuredAlt || campaign.title)}" width="${featuredImage.width}" height="${featuredImage.height}" loading="eager" fetchpriority="high" decoding="async" data-no-zoom`);
    }
  }
});
