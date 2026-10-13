import { expect, test } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

test("deployment artifact carries only CloudLink redirects, without duplicate CloudForce policies", async ({}, testInfo) => {
  test.skip(!testInfo.config.metadata?.siteRoot, "This assertion checks the generated publication artifact.");
  const root = join(process.cwd(), testInfo.config.metadata.siteRoot);
  const redirects = await readFile(join(root, "_redirects"), "utf8");
  for (const [source, target] of [
    ["/cloudforce", "https://cloudlink.games/support/"],
    ["/cloudforce/", "https://cloudlink.games/support/"],
    ["/cloudforce/index.html", "https://cloudlink.games/support/"],
    ["/cloudforce/privacy", "https://cloudlink.games/privacy/"],
    ["/cloudforce/privacy/", "https://cloudlink.games/privacy/"],
    ["/cloudforce/privacy/index.html", "https://cloudlink.games/privacy/"],
  ]) expect(redirects.split("\n")).toContain(`${source} ${target} 301`);
  for (const file of ["cloudforce/index.html", "cloudforce/privacy/index.html", "assets/data/cloudforce-pages.json"]) {
    expect(await stat(join(root, file)).catch(() => null), file).toBeNull();
  }
  expect(await readFile(join(root, "sitemap.xml"), "utf8")).not.toContain("/cloudforce/");
  expect(await stat(join(root, "redlink/index.html"))).toBeTruthy();
  expect(await stat(join(root, "redlink/privacy/index.html"))).toBeTruthy();
});
