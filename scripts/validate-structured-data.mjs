import { readFile } from "node:fs/promises";

const files = [
  "index.html",
  "blog/index.html",
  "portfolio/index.html",
  "contact/index.html"
];

const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gim;

for (const file of files) {
  const html = await readFile(file, "utf8");
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
  });
}
