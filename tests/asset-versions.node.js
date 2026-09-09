import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { versionAssetReferences } from "../scripts/version-assets.mjs";

test("asset URLs follow content, preserve URL semantics, and converge", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "asset-versions-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "assets/js"), { recursive: true });
  await mkdir(join(root, "assets/css"), { recursive: true });
  await writeFile(join(root, "assets/js/tag.js"), "first");
  await writeFile(join(root, "assets/css/main.css"), "body {}");
  const html = '<script src="../../assets/js/tag.js?mode=one&amp;v=old#ready"></script><link rel="stylesheet" href="/assets/css/main.css"><script src="https://example.com/assets/js/tag.js"></script>';
  const first = await versionAssetReferences(html, "work/example/index.html", root);
  assert.match(first, /tag\.js\?mode=one&amp;v=[a-f0-9]{16}#ready/);
  assert.match(first, /main\.css\?v=[a-f0-9]{16}/);
  assert.ok(first.includes('src="https://example.com/assets/js/tag.js"'));
  assert.equal(await versionAssetReferences(first, "work/example/index.html", root), first);
  await writeFile(join(root, "assets/js/tag.js"), "second");
  const second = await versionAssetReferences(first, "work/example/index.html", root);
  assert.notEqual(second, first);
  assert.equal(second.match(/main\.css[^\"]+/)[0], first.match(/main\.css[^\"]+/)[0]);
  await assert.rejects(versionAssetReferences('<script src="/assets/js/missing.js"></script>', "index.html", root), /ENOENT/);
});


test("module entries retain their import identity and all JS must revalidate", async () => {
  const root = new URL("../", import.meta.url).pathname;
  const html = '<script type="module" src="./assets/js/inbound-prompt.js"></script>';
  assert.equal(await versionAssetReferences(html, "index.html", root), html);
  const { readFile } = await import("node:fs/promises");
  const importer = await readFile(new URL("../assets/js/header-scroll.js", import.meta.url), "utf8");
  assert.match(importer, /import "\.\/inbound-prompt\.js"/);
  const entry = new URL("./assets/js/inbound-prompt.js", "https://example.com/");
  assert.equal(new URL("./inbound-prompt.js", "https://example.com/assets/js/header-scroll.js").href, entry.href);
  const headers = await readFile(new URL("../_headers", import.meta.url), "utf8");
  assert.match(headers, /\n\/assets\/js\/\*\n  Cache-Control: no-cache\n/);
});
