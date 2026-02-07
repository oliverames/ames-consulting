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
  const routes = ["/", "/blog/", "/portfolio/", "/contact/"];
  const urls = new Set(routes.map((route) => `${siteUrl}${route}`));

  try {
    const content = JSON.parse(await readFile("assets/data/content.example.json", "utf8"));
    (content.posts || []).forEach((post) => {
      if (typeof post.url !== "string" || post.url.trim().length === 0) {
        return;
      }

      try {
        const absolute = new URL(post.url, `${siteUrl}/`).toString();
        if (absolute.startsWith(siteUrl)) {
          urls.add(absolute);
        }
      } catch {
        // ignore invalid url
      }
    });
  } catch {
    // ignore data errors in generation path
  }

  return [...urls].sort((a, b) => a.localeCompare(b));
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
