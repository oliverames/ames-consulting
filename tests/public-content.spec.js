import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PUBLIC_HTML_FILES } from "../scripts/publication-policy.mjs";

const root = process.cwd();
const read = (relativePath) => {
  const configuredRoot = test.info().config.metadata?.siteRoot || ".";
  return readFile(join(root, configuredRoot, relativePath), "utf8");
};

test("public testimonials omit private performance-review material", async () => {
  const html = await read("testimonials/index.html");

  expect(html).toContain("Public LinkedIn recommendations");
  expect(html).not.toMatch(/performance review|performance feedback/i);
  expect(html).not.toContain("Jevonne McLaughlin");
});

test("Fairbanks pages use the public Guinness record instead of internal revenue", async () => {
  const pages = await Promise.all([
    read("about/index.html"),
    read("work/index.html"),
    read("work/fairbanks-planetarium/index.html"),
  ]);

  for (const html of pages) {
    expect(html).not.toMatch(/134\.8%|\$13,359\.80|\$31,363\.40|planetarium revenue/i);
  }
  expect(pages[2]).toContain("1,580 people");
  expect(pages[2]).toContain("Guinness World Records");
});

test("contact form names the services that process an inquiry", async () => {
  const html = await read("contact/index.html");

  expect(html).toContain("Cloudflare Turnstile checks this form for spam");
  expect(html).toContain("Resend delivers your message by email");
  expect(html).toContain("I use your contact details and message to reply to your inquiry");
  expect(html).toContain("This form needs JavaScript for spam protection");
  expect(html).toContain('href="mailto:oliver@ames.consulting"');
});

test("contact form fallback gives visitors a direct alternative", async () => {
  const source = await read("assets/js/contact-form.js");

  expect(source).toContain("The form is unavailable right now. Please email me at oliver@ames.consulting.");
  expect(source).not.toContain("Add contactFormEndpoint in site.config.json");
});

test("service breadcrumbs omit the nonexistent services index", async () => {
  const html = await read("services/photography-and-video/index.html");
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const graphs = scripts.map((match) => JSON.parse(match[1]));
  const breadcrumb = graphs
    .flatMap((data) => data["@graph"] || [])
    .find((item) => item["@type"] === "BreadcrumbList");

  expect(breadcrumb).toBeTruthy();
  expect(breadcrumb.itemListElement.map((item) => item.item)).toEqual([
    "https://ames.consulting/",
    "https://ames.consulting/services/photography-and-video/",
  ]);
});

test("retired routes and asset prefixes are absent from the public artifact", async ({ request }) => {
  const retiredPaths = [
    "/work/beta-andrew/",
    "/work/beta-emma/",
    "/work/beta-ethan/",
    "/assets/images/work/events/beta-andrew/dsc08015.webp",
    "/assets/images/work/events/beta-emma/dsc07894.webp",
    "/assets/images/work/events/beta-ethan/dsc08105.webp",
    "/assets/images/work/eastrise/photography/_unassigned-public-assets/people-and-portraits/2024-10-15_16-42-38_UTC_DBJuJuUpFzc-0aff11d03784.webp",
  ];

  for (const retiredPath of retiredPaths) {
    const response = await request.get(retiredPath, { failOnStatusCode: false });
    expect(response.status(), retiredPath).toBe(404);
  }
});

test("every public document declares the shared OA favicon", async ({ request }) => {
  for (const relativePath of PUBLIC_HTML_FILES) {
    const html = await read(relativePath);
    expect(html, relativePath).toMatch(/<link rel="icon" href="[^"]*assets\/images\/brand\/oa-social-mark\.svg" type="image\/svg\+xml">/);
  }

  const response = await request.get("/assets/images/brand/oa-social-mark.svg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});
