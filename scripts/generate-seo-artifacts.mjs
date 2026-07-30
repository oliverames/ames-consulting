import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
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

async function getKnownRoutes(siteUrl, outDir) {
  const routes = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (["assets", ".git", "node_modules"].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.name === "index.html") {
        const relativePath = path.relative(outDir, fullPath).split(path.sep).join("/").replace(/index\.html$/, "");
        routes.push(`${siteUrl}/${relativePath}`);
      }
    }
  }
  await visit(outDir);
  return [...new Set(routes)].sort();
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

function buildLlmsTxt(siteUrl) {
  return [
    "# Oliver Ames",
    "",
    "> Oliver Ames is a commercial photographer, content strategist, video producer, and software developer based in Montpelier, Vermont.",
    "",
    "## Primary services",
    `- [Commercial photography and video](${siteUrl}/services/photography-and-video/): documentary workplace photography, corporate portraits, events, and video production across Vermont.`,
    `- [Content strategy and campaigns](${siteUrl}/services/strategy-and-content/): campaign planning, writing, social media, and measurement.`,
    `- [Websites and practical technology](${siteUrl}/services/practical-technology/): websites, accessibility, analytics, automation, and software.`,
    "",
    "## Evidence",
    `- [Selected work](${siteUrl}/work/)`,
    `- [About Oliver Ames](${siteUrl}/about/)`,
    `- [Recommendations](${siteUrl}/testimonials/)`,
    `- [Writing](${siteUrl}/blog/)`,
    "",
    "## Contact",
    `- [Start a conversation](${siteUrl}/contact/)`,
    "- Email: oliver@ames.consulting",
    ""
  ].join("\n");
}

const args = parseArgs(process.argv.slice(2));
const outDir = args.outDir || ".";
const domain = await getPrimaryDomain();
const siteUrl = normalizeSiteUrl(domain);
const routes = await getKnownRoutes(siteUrl, outDir);

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "sitemap.xml"), buildSitemapXml(routes), "utf8");
await writeFile(path.join(outDir, "robots.txt"), buildRobotsTxt(siteUrl, domain), "utf8");
await writeFile(path.join(outDir, "llms.txt"), buildLlmsTxt(siteUrl), "utf8");
