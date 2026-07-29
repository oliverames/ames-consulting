import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--out-dir") {
      parsed.outDir = argv[i + 1];
      i += 1;
    }
  }

  return parsed;
}

async function getPrimaryDomain() {
  try {
    const cname = await readFile("CNAME", "utf8");
    const domain = cname.trim();
    if (domain) {
      return domain;
    }
  } catch {
    // fall through
  }

  return "ames.consulting";
}

function normalizeSiteUrl(domain) {
  const clean = domain.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return `https://${clean}`;
}

async function getKnownRoutes(siteUrl) {
  const routes = [
    `${siteUrl}/`,
    `${siteUrl}/work/`,
    `${siteUrl}/blog/`,
    `${siteUrl}/testimonials/`,
    `${siteUrl}/services/strategy-and-content/`,
    `${siteUrl}/services/photography-and-video/`,
    `${siteUrl}/services/practical-technology/`,
    `${siteUrl}/work/eastrise/`,
    `${siteUrl}/work/eastrise-photography/`,
    `${siteUrl}/work/eastrise-social/`,
    `${siteUrl}/work/eastrise-writing/`,
    `${siteUrl}/work/wheels-for-warmth/`,
    `${siteUrl}/work/taylor-hoar-racing/`,
    `${siteUrl}/work/member-banking-stories/`,
    `${siteUrl}/work/credit-union-websites/`,
    `${siteUrl}/work/community-photography/`,
    `${siteUrl}/work/portraits-and-people/`,
    `${siteUrl}/work/corporate-cup-2026/`,
    `${siteUrl}/work/girls-on-the-run-2026/`,
    `${siteUrl}/work/eastrise-launch-campaign/`,
    `${siteUrl}/work/flight-paths/`,
    `${siteUrl}/work/blue-cross-vermont/`,
    `${siteUrl}/work/beta-technologies/`,
    `${siteUrl}/work/vtdigger-membership/`,
    `${siteUrl}/work/fairbanks-planetarium/`,
    `${siteUrl}/work/live-broadcasts/`,
    `${siteUrl}/work/green-mountain-community-fitness/`,
    `${siteUrl}/work/sweat-heart-throwdown/`,
    `${siteUrl}/work/bike-fitting/`,
    `${siteUrl}/about/`,
    `${siteUrl}/contact/`
  ];

  try {
    const feed = JSON.parse(await readFile("assets/data/writing-feed.json", "utf8"));
    for (const post of feed.posts || []) {
      if (!post.platforms?.includes("Micro.blog") || (!post.title && post.text?.length < 800)) continue;
      const slug = String(post.title || post.id)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      routes.push(`${siteUrl}/blog/${slug}/`);
    }
  } catch {
    // Writing pages are optional during isolated SEO generation.
  }

  return routes;
}

function buildSitemapXml(urls) {
  const now = new Date().toISOString();
  const entries = urls
    .map((url) => {
      return [
        "  <url>",
        `    <loc>${url}</loc>`,
        `    <lastmod>${now}</lastmod>`,
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    entries,
    "</urlset>",
    ""
  ].join("\n");
}

function buildRobotsTxt(siteUrl, domain) {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /*?q=",
    "Disallow: /*?tag=",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${domain}`,
    ""
  ].join("\n");
}

const args = parseArgs(process.argv.slice(2));
const outDir = args.outDir || ".";
const domain = await getPrimaryDomain();
const siteUrl = normalizeSiteUrl(domain);
const routes = await getKnownRoutes(siteUrl);

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "sitemap.xml"), buildSitemapXml(routes), "utf8");
await writeFile(path.join(outDir, "robots.txt"), buildRobotsTxt(siteUrl, domain), "utf8");
