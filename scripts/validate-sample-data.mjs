import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const content = JSON.parse(await readFile("assets/data/content.example.json", "utf8"));
assert(Array.isArray(content.posts), "content.example.json must include a posts array");

content.posts.forEach((post, index) => {
  const prefix = `content.example.json post[${index}]`;
  assert(isNonEmptyString(post.id), `${prefix} must include a non-empty id`);
  assert(isNonEmptyString(post.title), `${prefix} must include a non-empty title`);
  assert(isNonEmptyString(post.summary), `${prefix} must include a non-empty summary`);
  assert(isNonEmptyString(post.publishedAt), `${prefix} must include publishedAt`);
  assert(Array.isArray(post.tags), `${prefix} tags must be an array`);
  assert(post.tags.every((tag) => typeof tag === "string"), `${prefix} tags must be strings`);
});

const feed = JSON.parse(await readFile("assets/data/microblog-feed.example.json", "utf8"));
assert(Array.isArray(feed.items), "microblog-feed.example.json must include items array");

feed.items.forEach((item, index) => {
  const prefix = `microblog-feed.example.json item[${index}]`;
  assert(isNonEmptyString(String(item.id || item.url || "")), `${prefix} must include id or url`);
  assert(
    isNonEmptyString(item.content_text || "") || isNonEmptyString(item.content_html || ""),
    `${prefix} must include content_text or content_html`
  );
});
