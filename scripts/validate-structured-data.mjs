import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

async function collect(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    // Keep in sync with apply-shared-ui.mjs, apply-image-dimensions.mjs, and
    // apply-seo.mjs.
    if (["node_modules", ".git", "_site", "playwright-report", "test-results", "output"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name === "index.html") files.push(path);
  }
  return files;
}

const files = await collect(".");

const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gim;
const stripMarkup = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#39;", "'")
  .replace(/\s+/g, " ")
  .trim();

const photographyImage = "https://ames.consulting/assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08460.webp";

for (const file of files) {
  const html = await readFile(file, "utf8");
  const path = relative(".", file).split(sep).join("/");
  for (const required of ['<meta name="description"', '<meta name="robots"', '<link rel="canonical"', 'property="og:title"', 'name="twitter:card"']) {
    if (!html.includes(required)) throw new Error(`Missing ${required} in ${file}`);
  }
  const description = html.match(/<meta\s[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1];
  const normalizedDescription = stripMarkup(description);
  if (!normalizedDescription || /(?:…|\.\.\.)$/.test(normalizedDescription) || !/[.!?](?:["')\]])?$/.test(normalizedDescription)) {
    throw new Error(`Meta description is missing or ends mid-thought in ${file}`);
  }
  const matches = [...html.matchAll(jsonLdPattern)];

  if (matches.length === 0) {
    throw new Error(`Missing JSON-LD block in ${file}`);
  }

  matches.forEach((match, index) => {
    const jsonText = match[1].trim();
    let parsed;

    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`Invalid JSON-LD in ${file} (block ${index + 1}): ${error.message}`);
    }

    if (!parsed["@context"]) {
      throw new Error(`JSON-LD missing @context in ${file} (block ${index + 1})`);
    }
    const graph = parsed["@graph"] || [];
    for (const type of ["WebSite", "Person", "ProfessionalService"]) {
      if (!graph.some((node) => node["@type"] === type)) throw new Error(`JSON-LD missing ${type} in ${file}`);
    }

    const pageNode = graph.find((node) => String(node["@id"] || "").endsWith("#page"));
    if (!pageNode) throw new Error(`JSON-LD missing page node in ${file}`);

    const isBlogPost = /^blog\/(?!archive\/index\.html$)(?!index\.html$)[^/]+\/index\.html$/.test(path);
    if (isBlogPost) {
      const headline = stripMarkup(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
      const datePublished = html.match(/<time\b[^>]*\bdatetime="([^"]+)"[^>]*>/i)?.[1];
      if (pageNode["@type"] !== "BlogPosting") throw new Error(`Blog post is not BlogPosting in ${file}`);
      if (!headline || pageNode.headline !== headline) throw new Error(`BlogPosting headline does not match the page H1 in ${file}`);
      if (!datePublished || pageNode.datePublished !== datePublished) throw new Error(`BlogPosting datePublished does not match the visible time in ${file}`);
      if (Number.isNaN(Date.parse(datePublished))) throw new Error(`BlogPosting datePublished is not a valid date in ${file}`);
      if (!html.includes('<meta property="og:type" content="article">')) throw new Error(`Blog post Open Graph type is not article in ${file}`);
    }

    if (path === "blog/archive/index.html") {
      if (pageNode["@type"] !== "CollectionPage") throw new Error(`Writing archive is not a CollectionPage in ${file}`);
      if (!html.includes('<meta property="og:type" content="website">')) throw new Error(`Writing archive Open Graph type is not website in ${file}`);
    }

    if (path === "services/photography-and-video/index.html") {
      if (pageNode.image !== photographyImage) throw new Error(`Photography service JSON-LD uses an unrelated image in ${file}`);
      if (!html.includes(`<meta property="og:image" content="${photographyImage}">`)) throw new Error(`Photography service Open Graph image is incorrect in ${file}`);
      if (!html.includes(`<meta name="twitter:image" content="${photographyImage}">`)) throw new Error(`Photography service Twitter image is incorrect in ${file}`);
    }
  });
}

console.log(`Validated SEO metadata and structured data in ${files.length} pages.`);
