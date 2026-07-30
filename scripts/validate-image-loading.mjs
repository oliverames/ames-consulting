import { glob, readFile } from "node:fs/promises";

const patterns = "{index.html,404.html,about/index.html,blog/**/*.html,contact/index.html,testimonials/index.html,services/**/*.html,work/**/*.html}";
const errors = [];
let imageCount = 0;
let lazyCount = 0;
let eagerCount = 0;

for await (const file of glob(patterns)) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    imageCount += 1;
    const tag = match[0];
    const loading = tag.match(/\bloading="(lazy|eager)"/i)?.[1]?.toLowerCase();
    if (!loading) {
      errors.push(`${file}: image is missing an explicit loading policy: ${tag.slice(0, 180)}`);
      continue;
    }
    if (loading === "lazy") lazyCount += 1;
    if (loading === "eager") {
      eagerCount += 1;
      if (!/\bfetchpriority="high"/i.test(tag)) {
        errors.push(`${file}: eager image is missing fetchpriority="high": ${tag.slice(0, 180)}`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${imageCount} images: ${lazyCount} lazy and ${eagerCount} eager.`);
}
