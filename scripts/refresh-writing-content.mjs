import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const exec = promisify(execFile);
const eastRiseSource = "/Users/oliverames/My Drive (Personal)/Career/Work Samples/Oliver's EastRise Blog Posts.csv";

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  fields.push(value);
  return fields;
}

function stripHtml(value = "") {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&rsquo;", "’")
    .replaceAll("&lsquo;", "‘")
    .replaceAll("&ldquo;", "“")
    .replaceAll("&rdquo;", "”")
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&hellip;", "…")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .trim();
}

function bskyUrl(uri) {
  const postId = uri.split("/").pop();
  return `https://bsky.app/profile/oliverames.bsky.social/post/${postId}`;
}

async function json(url) {
  const response = await fetch(url, { headers: { "User-Agent": "ames.consulting writing archive" } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json();
}

let eastRise;
try {
  const csv = await readFile(eastRiseSource, "utf8");
  eastRise = csv.trim().split(/\r?\n/).slice(1).map((line, index) => {
    const [title, date, category, url] = parseCsvLine(line);
    return {
      id: index + 1,
      title,
      date: date === "Not Available" ? null : date,
      category: category === "Not Available" ? "Technology & Banking" : category,
      url,
      available: title !== "Page Not Found (404)",
      archivedTitle: title === "Page Not Found (404)" ? "A Comprehensive Guide to EV Charging Apps" : null
    };
  });
} catch {
  eastRise = JSON.parse(await readFile(join(root, "assets/data/eastrise-writing.json"), "utf8")).articles;
}

const micro = await json("https://oliverames.micro.blog/feed.json");
const mastodonAccount = await json("https://mastodon.social/api/v1/accounts/lookup?acct=oliverames");
const mastodon = await json(`https://mastodon.social/api/v1/accounts/${mastodonAccount.id}/statuses?exclude_reblogs=true&exclude_replies=true&limit=20`);
const bluesky = await json("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=oliverames.bsky.social&filter=posts_no_replies&limit=20");

const threadsOriginals = [
  { id: "Da0B9d1kdGK", date: "2026-07-15T00:00:00Z", text: "I’m so happy for them 😭😭😭" },
  { id: "Day64kCkVIk", date: "2026-07-14T00:00:00Z", text: "Crazy stuff. This is the fire, I think, creating the smoke haze in Vermont today." },
  { id: "Dau6BiVEYGY", date: "2026-07-13T00:00:00Z", text: "Slava Ukraini! 🇺🇦" },
  { id: "Dak4hmSEXjO", date: "2026-07-09T00:00:00Z", text: "The team that made this video truly cooked. Marketing at its finest!" }
];

const linkedinOriginals = [
  {
    id: "pride-month-2026",
    date: "2026-06-01T00:00:00Z",
    text: "I've sat in enough marketing meetings to know how easily a post like this gets hedged into nothing, and this one didn't. That says a lot about the people I work with and the organization behind it. Proud of both. 💙 Happy #PrideMonth, #Vermont! 🌈",
    url: "https://www.linkedin.com/in/oliverames/recent-activity/all/",
    image: "https://media.licdn.com/dms/image/v2/D4E10AQF77ywkJl3faw/image-shrink_800/B4EZ6DsJ9wJwAg-/0/1780325851563?e=2147483647&v=beta&t=XuGuLYDNyBhEWvkMvylzX5tINJ29q0UX5Lj44HowNJA",
    sharedPost: {
      author: "Blue Cross and Blue Shield of Vermont",
      url: "https://www.linkedin.com/posts/bluecrossvt_pride-month-is-a-good-time-to-say-something-activity-7467227840711819264-33mQ",
      text: "Pride Month is a good time to say something plainly: LGBTQ+ Vermonters deserve care that respects who they are, because feeling safe and seen is part of being healthy.\n\nAt Blue Cross and Blue Shield of Vermont, whole person care means supporting both body and mind, so our member benefits include access to mental health counseling. In addition, we offer personalized, voluntary, no-cost support to navigate gender affirming services from our expert team of nurses and social workers.\n\nWe’re proud to support organizations like Outright Vermont, the Pride Center of Vermont, and the Barre People's Health & Wellness Clinic, which partners with the Rainbow Bridge Community Center to help community members access youth and family support, crisis resources, and free affirming care information.\n\nStart with mental health support resources: https://lnkd.in/eXKRjT-h",
    },
  },
];

const rawPosts = [
  ...micro.items.map((item) => ({
    id: `microblog:${item.id}`,
    platform: "Micro.blog",
    date: item.date_published,
    title: item.title || "",
    text: stripHtml(item.content_html || item.content_text || ""),
    url: item.url,
    image: item.image || item.attachments?.find((attachment) => attachment.mime_type?.startsWith("image/"))?.url || ""
  })),
  ...mastodon.map((item) => ({
    id: `mastodon:${item.id}`,
    platform: "Mastodon",
    date: item.created_at,
    title: "",
    text: stripHtml(item.content),
    url: item.url,
    image: item.media_attachments?.find((attachment) => attachment.type === "image")?.url || ""
  })),
  ...bluesky.feed.filter((item) => !item.reason).map((item) => ({
    id: `bluesky:${item.post.uri}`,
    platform: "Bluesky",
    date: item.post.record.createdAt || item.post.indexedAt,
    title: "",
    text: item.post.record.text,
    url: bskyUrl(item.post.uri),
    image: item.post.embed?.images?.[0]?.fullsize || item.post.embed?.external?.thumb || ""
  })),
  ...threadsOriginals.map((item) => ({
    id: `threads:${item.id}`,
    platform: "Threads",
    date: item.date,
    title: "",
    text: item.text,
    url: `https://www.threads.com/@oliverames/post/${item.id}`,
    image: ""
  })),
  ...linkedinOriginals.map((item) => ({
    id: `linkedin:${item.id}`,
    platform: "LinkedIn",
    date: item.date,
    title: "",
    text: item.text,
    url: item.url,
    image: item.image,
    sharedPost: item.sharedPost,
  }))
].filter((post) => post.text || post.title);

for (const post of rawPosts) {
  if (post.title?.includes("The Sunshine Trail:")) {
    post.image = "https://cdn.uploads.micro.blog/92164/2026/the-sunshine-trail-screenshots.jpg";
  }
}

const grouped = new Map();
for (const post of rawPosts) {
  const key = `${post.title}\n${post.text}`.toLocaleLowerCase().replace(/\s+/g, " ").trim();
  const current = grouped.get(key);
  if (current) {
    if (!current.platforms.includes(post.platform)) current.platforms.push(post.platform);
    current.links.push({ platform: post.platform, url: post.url });
    if (new Date(post.date) > new Date(current.date)) current.date = post.date;
  } else {
    grouped.set(key, {
      id: post.id,
      platforms: [post.platform],
      links: [{ platform: post.platform, url: post.url }],
      date: post.date,
      title: post.title,
      text: post.text,
      image: post.image,
      sharedPost: post.sharedPost,
    });
  }
}
const posts = [...grouped.values()].sort((left, right) => new Date(right.date) - new Date(left.date));

const writingImageDirectory = join(root, "assets/images/writing");
await mkdir(writingImageDirectory, { recursive: true });
for (const post of posts.filter((item) => item.image)) {
  const response = await fetch(post.image);
  if (!response.ok) throw new Error(`${response.status} while downloading ${post.image}`);
  const stem = createHash("sha256").update(post.id).digest("hex").slice(0, 12);
  const source = join(writingImageDirectory, `${stem}.source`);
  const destination = join(writingImageDirectory, `${stem}.webp`);
  await writeFile(source, Buffer.from(await response.arrayBuffer()));
  await exec("/opt/homebrew/bin/magick", [source, "-auto-orient", "-resize", "1800x1800>", "-strip", "-quality", "86", destination]);
  await exec("/usr/bin/trash", [source]);
}

await writeFile(join(root, "assets/data/eastrise-writing.json"), `${JSON.stringify({ count: eastRise.length, articles: eastRise }, null, 2)}\n`);
await writeFile(join(root, "assets/data/writing-feed.json"), `${JSON.stringify({
  refreshedAt: new Date().toISOString(),
  canonicalBlog: "https://oliverames.micro.blog/",
  profiles: [
    { platform: "LinkedIn", url: "https://www.linkedin.com/in/oliverames", automated: false },
    { platform: "Micro.blog", url: "https://oliverames.micro.blog/", feed: "https://oliverames.micro.blog/feed.json", automated: true },
    { platform: "Mastodon", url: "https://mastodon.social/@oliverames", automated: true },
    { platform: "Bluesky", url: "https://bsky.app/profile/oliverames.bsky.social", automated: true },
    { platform: "Threads", url: "https://www.threads.com/@oliverames", automated: false },
    { platform: "Instagram", url: "https://www.instagram.com/oliverames/", automated: false }
  ],
  posts
}, null, 2)}\n`);

console.log(`Captured ${eastRise.length} EastRise articles and ${posts.length} personal posts.`);
