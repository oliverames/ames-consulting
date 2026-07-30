import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function collect(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "_site"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name === "index.html") files.push(path);
  }
  return files;
}

const files = await collect(".");

const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gim;

for (const file of files) {
  const html = await readFile(file, "utf8");
  for (const required of ['<meta name="description"', '<meta name="robots"', '<link rel="canonical"', 'property="og:title"', 'name="twitter:card"']) {
    if (!html.includes(required)) throw new Error(`Missing ${required} in ${file}`);
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
  });
}

console.log(`Validated SEO metadata and structured data in ${files.length} pages.`);
