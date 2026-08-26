import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { SERVICES } from "./site-taxonomy.mjs";
import { hasRobotsDirective } from "./html-metadata.mjs";

const exec = promisify(execFile);

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
      if (["assets", ".git", "_site", "node_modules", "playwright-report", "test-results"].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.name === "index.html") {
        // Pages marked noindex must not be advertised to crawlers.
        const html = await readFile(fullPath, "utf8");
        if (hasRobotsDirective(html)) continue;
        const relativePath = path.relative(outDir, fullPath).split(path.sep).join("/").replace(/index\.html$/, "");
        routes.push({
          url: `${siteUrl}/${relativePath}`,
          sourcePath: path.relative(outDir, fullPath).split(path.sep).join("/"),
        });
      }
    }
  }
  await visit(outDir);
  return [...new Map(routes.map((route) => [route.url, route])).values()]
    .sort((left, right) => left.url.localeCompare(right.url));
}

async function getLastModified(sourcePath) {
  try {
    if (process.env.SOURCE_DATE_EPOCH) {
      const seconds = Number(process.env.SOURCE_DATE_EPOCH);
      if (!Number.isFinite(seconds)) throw new Error("SOURCE_DATE_EPOCH must be a Unix timestamp.");
      return new Date(seconds * 1000).toISOString().slice(0, 10);
    }
    const { stdout } = await exec("git", ["log", "-1", "--format=%cs", "--", sourcePath]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function buildSitemapXml(routes) {
  const entries = await Promise.all(
    routes.map(async ({ url, sourcePath }) => {
      const lastModified = await getLastModified(sourcePath);
      return [
        "  <url>",
        `    <loc>${url}</loc>`,
        ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
        "  </url>"
      ].join("\n");
    }),
  );

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    entries.join("\n"),
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
  const descriptions = {
    "photography-and-video": "documentary workplace photography, corporate portraits, events, and video production across Vermont.",
    "strategy-and-content": "campaign planning, writing, social media, and measurement.",
    "practical-technology": "websites, accessibility, analytics, automation, and software.",
  };
  return [
    "# Oliver Ames",
    "",
    "> Oliver Ames is a commercial photographer, content strategist, video producer, and software developer based in Montpelier, Vermont.",
    "",
    "## Primary services",
    ...SERVICES.map(({ slug, title }) => `- [${title}](${siteUrl}/services/${slug}/): ${descriptions[slug]}`),
    "",
    "## Evidence",
    `- [Selected work](${siteUrl}/work/)`,
    `- [About Oliver Ames](${siteUrl}/about/)`,
    `- [Recommendations](${siteUrl}/testimonials/)`,
    `- [Writing](${siteUrl}/blog/)`,
    "",
    "## Contact",
    `- [Send me a note](${siteUrl}/contact/)`,
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
await writeFile(path.join(outDir, "sitemap.xml"), await buildSitemapXml(routes), "utf8");
await writeFile(path.join(outDir, "robots.txt"), buildRobotsTxt(siteUrl, domain), "utf8");
await writeFile(path.join(outDir, "llms.txt"), buildLlmsTxt(siteUrl), "utf8");
