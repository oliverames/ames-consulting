import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { PUBLIC_HTML_FILES } from "../scripts/publication-policy.mjs";
import { projectRootFromScriptUrl } from "../scripts/script-paths.mjs";
import { SERVICES, WORK_PROJECT_TITLES } from "../scripts/site-taxonomy.mjs";
import { parseWritingFeedRefreshedAt } from "../scripts/writing-feed-validation.mjs";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFile(path.join(root, file), "utf8");
const stripMarkup = (value) => value.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&").trim();
const serviceTitles = SERVICES.map(({ title }) => title);
const workDetailFiles = PUBLIC_HTML_FILES.filter((file) => /^work\/[^/]+\/index\.html$/.test(file));
const footerDescription = "My name is Oliver. Ames Consulting is my photography and communications practice in Montpelier, Vermont. I also build websites and apps when a project needs them.";
const socialProfiles = [
  "https://github.com/oliverames",
  "https://www.linkedin.com/in/oliverames",
  "https://oliverames.micro.blog/",
  "https://mastodon.social/@oliverames",
  "https://bsky.app/profile/oliverames.bsky.social",
  "https://www.threads.com/@oliverames",
  "https://www.instagram.com/oliverames/",
];

test("the pre-ship gate proves convergence before validating its final build", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  assert.deepEqual(scripts["check:ship"].split(/\s*&&\s*/), [
    "npm run check:build-idempotence",
    "npm run build:site",
    "npm run check:all",
    "npm run check:built-site",
    "npm run test:site",
  ]);
  assert.doesNotMatch(scripts["check:all"], /check:ship/);
});

test("build script roots preserve spaces in checkout paths", async () => {
  const checkoutRoot = path.join(root, "fixture checkout with spaces");
  const scriptUrl = pathToFileURL(path.join(checkoutRoot, "scripts", "probe.mjs"));
  assert.equal(path.resolve(projectRootFromScriptUrl(scriptUrl)), checkoutRoot);

  for (const filename of [
    "scripts/apply-shared-ui.mjs",
    "scripts/apply-image-dimensions.mjs",
  ]) {
    assert.match(
      await read(filename),
      /projectRootFromScriptUrl\(import\.meta\.url\)/,
      `${filename} must use the decoded project-root helper`,
    );
  }
});

test("writing feed refresh timestamps fail closed", () => {
  assert.equal(
    parseWritingFeedRefreshedAt({ refreshedAt: "2026-08-26T12:00:00-04:00" }).toISOString(),
    "2026-08-26T16:00:00.000Z",
  );
  assert.throws(
    () => parseWritingFeedRefreshedAt({ refreshedAt: "not-a-date" }),
    /valid ISO 8601 timestamp with an explicit timezone/,
  );
  assert.throws(
    () => parseWritingFeedRefreshedAt({}),
    /valid ISO 8601 timestamp with an explicit timezone/,
  );
  assert.throws(
    () => parseWritingFeedRefreshedAt({ refreshedAt: "2026-08-26T12:00:00" }),
    /valid ISO 8601 timestamp with an explicit timezone/,
  );
  assert.throws(
    () => parseWritingFeedRefreshedAt({ refreshedAt: "2026-02-30T00:00:00Z" }),
    /valid ISO 8601 timestamp with an explicit timezone/,
  );
});

function expectedCurrent(file) {
  if (file === "index.html") return ["Home", "page"];
  const section = file.split("/", 1)[0];
  const labels = { work: "Work", services: "Services", blog: "Writing", about: "About", testimonials: "Testimonials", contact: "Contact" };
  const exact = file === `${section}/index.html`;
  return [labels[section], exact ? "page" : "true"];
}

function headingTexts(markup, level = 3) {
  return [...markup.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, "g"))]
    .map((match) => stripMarkup(match[1]));
}

function schemaGraph(markup) {
  const schema = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .find((entry) => Array.isArray(entry["@graph"]));
  return schema?.["@graph"] || [];
}

test("the project catalog covers every published work detail route", () => {
  const publishedSlugs = workDetailFiles.map((file) => file.split("/")[1]).sort();
  assert.deepEqual(Object.keys(WORK_PROJECT_TITLES).sort(), publishedSlugs);
  assert.ok(!publishedSlugs.includes("portraits-and-people"));
});

test("the retired portrait route redirects to the canonical collection", async () => {
  const redirects = new Set((await read("_redirects")).trim().split("\n"));
  assert.deepEqual(redirects, new Set([
    "/work/portraits-and-people/ /work/eastrise-portraits/ 301",
    "/work/giron-family-fall-2023/ /work/giron-family/#giron-family-fall-2023 301",
    "/work/giron-family-christmas-tree-farm-2024/ /work/giron-family/#giron-family-christmas-tree-farm-2024 301",
    "/work/giron-family-fall-2025/ /work/giron-family/#giron-family-fall-2025 301",
  ]));
});

test("primary navigation, section state, and shared footer stay canonical", async () => {
  const expectedLabels = ["Home", "Work", "Services", "Writing", "About", "Testimonials", "Store", "Contact"];
  for (const file of PUBLIC_HTML_FILES.filter((entry) => entry !== "404.html")) {
    const html = await read(file);
    const nav = html.match(/<ul class="site-nav">([\s\S]*?)<\/ul>/)?.[1];
    assert.ok(nav, `${file} has no primary navigation`);
    const links = [...nav.matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)];
    assert.deepEqual(links.map((match) => match[2]), expectedLabels, `${file} navigation labels drifted`);
    const current = links
      .map((match) => [match[2], match[1].match(/aria-current="([^"]+)"/)?.[1]])
      .filter(([, value]) => value);
    assert.deepEqual(current, [expectedCurrent(file)], `${file} has the wrong current navigation state`);
    assert.match(html, /<nav class="site-footer__sitemap" aria-label="Footer"><div><h2>Work by organization<\/h2>/, `${file} footer heading drifted`);
    const company = html.match(/<h2>Company<\/h2>\s*<ul>([\s\S]*?)<\/ul>/)?.[1];
    assert.match(company || "", />Services<\/a>/, `${file} footer omits Services`);
    assert.match(company || "", /<a href="https:\/\/store\.ames\.consulting\/">Store<\/a>/, `${file} footer omits Store`);
    assert.match(nav, /<a href="https:\/\/store\.ames\.consulting\/">Store<\/a>/, `${file} navigation omits Store`);
    assert.ok(html.includes(`<div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>${footerDescription}</p></div>`), `${file} footer description drifted`);
    const social = html.match(/<ul class="site-footer__social">([\s\S]*?)<\/ul>/)?.[1];
    assert.ok(social, `${file} footer omits social profiles`);
    assert.deepEqual(
      [...social.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]),
      socialProfiles,
      `${file} footer social profiles drifted`,
    );
  }
});

test("top-level breadcrumbs use route names rather than editorial headlines", async () => {
  const routes = {
    "work/index.html": "Work",
    "services/index.html": "Services",
    "blog/index.html": "Writing",
    "about/index.html": "About",
    "testimonials/index.html": "Testimonials",
    "contact/index.html": "Contact",
  };
  for (const [file, expectedName] of Object.entries(routes)) {
    const breadcrumb = schemaGraph(await read(file))
      .find((entry) => entry["@type"] === "BreadcrumbList");
    assert.ok(breadcrumb, `${file} has no breadcrumb schema`);
    assert.equal(breadcrumb.itemListElement.at(-1)?.name, expectedName, `${file} breadcrumb name drifted`);
  }
});

test("service names and order match across the site", async () => {
  const home = await read("index.html");
  const practice = home.match(/<section class="practice-section" id="services">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(practice);
  assert.deepEqual(headingTexts(practice), serviceTitles);

  const about = await read("about/index.html");
  const capabilities = about.match(/<section class="about-capabilities">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(capabilities);
  assert.deepEqual(headingTexts(capabilities), serviceTitles);

  const servicesIndex = await read("services/index.html");
  const serviceCards = servicesIndex.match(/<section class="service-projects"[\s\S]*?<div class="service-projects__grid">([\s\S]*?)<\/div><\/section>/)?.[1];
  assert.ok(serviceCards);
  assert.deepEqual(headingTexts(serviceCards), serviceTitles);

  const contact = await read("contact/index.html");
  const select = contact.match(/<select name="projectType">([\s\S]*?)<\/select>/)?.[1];
  assert.ok(select);
  assert.deepEqual(
    [...select.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map((match) => match[1]),
    ["Choose one", ...serviceTitles, "Something else"],
  );

  for (const { slug, title } of SERVICES) {
    const page = await read(`services/${slug}/index.html`);
    assert.equal(stripMarkup(page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || ""), title);
  }

  const inboundPrompt = await read("assets/js/inbound-prompt.js");
  assert.match(inboundPrompt, /import \{ SERVICES \} from "\.\/service-taxonomy\.js";/);
  for (const { slug } of SERVICES) {
    assert.match(inboundPrompt, new RegExp(`type: serviceTitles\\[${JSON.stringify(slug)}\\]`));
  }
});

test("work titles, metadata, cards, and return links use the project catalog", async () => {
  for (const file of workDetailFiles) {
    const html = await read(file);
    const slug = file.split("/")[1];
    const displayTitle = WORK_PROJECT_TITLES[slug];
    const title = stripMarkup(html.match(/<title>([^<]+)<\/title>/)?.[1] || "");
    assert.match(title, / \| Work by Oliver Ames$/, `${file} title suffix drifted`);
    assert.ok(html.includes(`"name":${JSON.stringify(displayTitle)}`), `${file} schema omits its display title`);
    assert.equal((html.match(/class="work-return"/g) || []).length, 1, `${file} needs one return link`);
    assert.match(html, /<nav class="work-return"[^>]*><a href="\.\.\/">← All work<\/a><\/nav>/);
  }

  for (const file of PUBLIC_HTML_FILES.filter((entry) => entry !== "404.html")) {
    const html = await read(file);
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a\s*>/g)) {
      const href = match[1].split(/[?#]/, 1)[0];
      const cardTitle = match[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
      if (!cardTitle || match[1].includes("#") || /^(?:https?:|mailto:|tel:)/i.test(href)) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), href));
      const slug = resolved.match(/^work\/([^/]+)\/?$/)?.[1];
      if (slug && WORK_PROJECT_TITLES[slug]) {
        assert.equal(stripMarkup(cardTitle), WORK_PROJECT_TITLES[slug], `${file} card name drifted for ${slug}`);
      }
    }
  }
});

test("internal links never use the external-link arrow", async () => {
  for (const file of PUBLIC_HTML_FILES.filter((entry) => entry !== "404.html")) {
    const html = await read(file);
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a\s*>/g)) {
      const [href, body] = [match[1], stripMarkup(match[2])];
      if (!/^(?:https?:|mailto:|tel:|#)/i.test(href)) {
        assert.ok(!body.includes("↗"), `${file} uses an external arrow for ${href}`);
      } else if (/^https?:/i.test(href) && /[→←↗]/.test(body)) {
        assert.ok(body.includes("↗"), `${file} uses an internal arrow for ${href}`);
        assert.ok(!/[→←]/.test(body), `${file} mixes arrow semantics for ${href}`);
      }
    }
  }
});

test("every ordered gallery explains its visible order", async () => {
  for (const file of PUBLIC_HTML_FILES) {
    const html = await read(file);
    const galleries = html.match(/<[^>]+data-order-mode="[^"]+"/g) || [];
    const notes = html.match(/<p class="gallery-order-note">/g) || [];
    assert.equal(notes.length, galleries.length, `${file} has an unexplained gallery order`);
    assert.doesNotMatch(html, /Complete photo series/);
  }
});

test("every public page carries the Google tag and a CSP that admits it", async () => {
  const { GOOGLE_TAG_CONFIG_PATH, GOOGLE_TAG_CSP_HOSTS, GOOGLE_TAG_LOADER_URL, googleTagMarkup } = await import(
    pathToFileURL(path.join(root, "scripts/google-tag.mjs")).href
  );
  for (const file of PUBLIC_HTML_FILES) {
    const html = await read(file);
    const depth = file.split("/").length - 1;
    const base = file === "404.html" ? "/" : depth === 0 ? "./" : "../".repeat(depth);
    assert.ok(html.includes(googleTagMarkup(base)), `${file} is missing the Google tag for base ${base}`);
    assert.equal(html.split(GOOGLE_TAG_CONFIG_PATH).length - 1, 1, `${file} loads the Google tag more than once`);
    assert.ok(!html.includes(GOOGLE_TAG_LOADER_URL), `${file} inlines Google's loader; google-tag.js appends it behind the hostname guard`);
    const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/)?.[1];
    assert.ok(csp, `${file} has no meta Content-Security-Policy`);
    for (const [directive, hosts] of Object.entries(GOOGLE_TAG_CSP_HOSTS)) {
      const sources = csp.match(new RegExp(`(?:^|;)\\s*${directive}\\s([^;]*)`))?.[1] ?? "";
      for (const host of hosts) assert.ok(sources.includes(host), `${file} CSP ${directive} lacks ${host}`);
    }
  }
});
