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
const EASTRISE_LEADERSHIP_SOURCE = "https://www.eastrise.com/leadership/";
const OFFICIAL_EASTRISE_PORTRAITS = new Map([
  ["Elizabeth Morton", "Elizabeth-Morton-1.jpg"],
  ["Greg Hahr", "Greg.jpg"],
  ["Mark Ackerly", "Mark.jpg"],
  ["Valerie Beaudin", "Valerie.jpg"],
  ["Rick Hommel", "Untitled-1.jpg"],
  ["Sue Leonard", "Sue.jpg"],
  ["Robert Miller", "Rob.jpg"],
  ["Subha Luck", "Subha-Luck-Headshot.jpg"],
  ["Frank G. Harris", "Frank-G.-Harris.jpg"],
  ["Margaret H. O’Donnell", "Margaret-H.-ODonnell.avif"],
  ["Stephanie Meunier", "Stephanie-Meunier-Headshot-1.jpg"],
  ["Julie Lineberger", "Julie-Lineberger-Headshot.jpg"],
  ["Amy Vaughan", "Amy-Vaughan-Headshot.jpg"],
  ["Michael Hogan", "Michael-Hogan-Headshot.jpg"],
  ["George Sales", "George-Sales-1.avif"],
  ["Spencer Newman", "Spencer-Newman-Headshot.jpg"],
  ["Arthur G. Woolf", "Arthur-G.-Woolf.jpg"],
]);

test("EastRise portraits match the official leadership source", async () => {
  const data = JSON.parse(await readFile(join(root, "assets/data/portraits.json"), "utf8"));
  const series = data.series.find((item) => item.slug === "eastrise-leadership-board");
  const expectedNames = [...OFFICIAL_EASTRISE_PORTRAITS.keys()]
    .sort((left, right) => left.localeCompare(right));
  const sourcedImages = series?.images.filter((image) => image.source) || [];

  expect(series?.sourcePage).toBe(EASTRISE_LEADERSHIP_SOURCE);
  expect(series?.sourceCaptureDate).toBe("2026-07-29");
  expect(series?.photographer).toBe("Oliver Ames");
  expect(
    sourcedImages.map((image) => image.caption)
      .sort((left, right) => left.localeCompare(right)),
  ).toEqual(expectedNames);

  for (const image of sourcedImages) {
    const sourceFile = OFFICIAL_EASTRISE_PORTRAITS.get(image.caption);
    expect(sourceFile, image.caption).toBeTruthy();
    expect(image.alt).toBe(`Portrait of ${image.caption}`);
    expect(image.source).toBe(`https://www.eastrise.com/files/${sourceFile}`);
  }

  const provenance = JSON.parse(
    await readFile(join(root, "assets/data/media-provenance.json"), "utf8"),
  );
  expect(
    Object.values(provenance.assets)
      .filter((record) => record.source_url === EASTRISE_LEADERSHIP_SOURCE),
  ).toHaveLength(OFFICIAL_EASTRISE_PORTRAITS.size);
  for (const image of sourcedImages) {
    const assetPath = image.src.replace(/^\.\.\/\.\.\//, "");
    const record = provenance.assets[assetPath];
    expect(record?.source_url, image.caption).toBe(EASTRISE_LEADERSHIP_SOURCE);
    expect(record?.source_channel, image.caption).toBe("website");
    expect(record?.downloaded_date, image.caption).toBe("2026-07-29");
    expect(record?.credit, image.caption).toBe(
      "Photographed by Oliver Ames for EastRise Credit Union",
    );
    expect(record?.accepted_exception?.reason, image.caption).toBe(
      "publication_date_not_verifiable",
    );
  }

  const html = await readPublic("work/eastrise-portraits/index.html");
  expect(html).toContain(`href="${EASTRISE_LEADERSHIP_SOURCE}"`);
});

test("withheld portrait source preserves every Blue Cross provenance record", async () => {
  const html = await readSource("work/blue-cross-portraits/index.html");
  const data = JSON.parse(await readFile(join(root, "assets/data/portraits.json"), "utf8"));
  const series = data.series.find((item) => item.slug === "blue-cross-cbss");
  const sourceLinks = series.images.map((image) => image.source).filter(Boolean);

  expect(html).toMatch(/<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i);
  expect(series?.published).toBe(false);
  expect(series?.images).toHaveLength(7);
  expect(sourceLinks).toEqual([
    "https://www.bluecrossvt.org/beth-roberts",
    "https://www.bluecrossvt.org/barbara-demas",
    "https://www.bluecrossvt.org/ruth-greene",
    "https://www.bluecrossvt.org/rebecca-heintz",
    "https://www.bluecrossvt.org/margaret-pinello-white",
    "https://www.bluecrossvt.org/tom-weigel",
  ]);
  expect(series.images.find((image) => image.caption === "Lindsay Segale")?.source).toBe("");
  expect(html.match(/class="portrait-card__image"/g) || []).toHaveLength(7);
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

  expect(series?.images.length).toBeGreaterThan(0);
  for (const image of series.images) {
    const description = escapeAttribute(image.alt);
    expect(html).toContain(`alt="${description}" aria-label="Open larger image: ${description}"`);
  }
  expect(html).not.toMatch(/aria-label="Open photograph \d+/);
});

function expectEventGalleryDescriptions(campaign, html) {
  for (const image of campaign.images) {
    const description = escapeAttribute(image.alt);
    expect(description.length).toBeGreaterThan(0);
    expect(html).toContain(`alt="${description}" aria-label="Open larger image: ${description}"`);
  }
  expect(html).not.toMatch(/aria-label="Open photograph \d+/);
  if (campaign.featuredFile) {
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
    const html = await readPublic(`work/${campaign.slug}/index.html`);
    expectEventGalleryDescriptions(campaign, html);
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
