import assert from "node:assert/strict";
import test from "node:test";
import { isBlockedPublicPath, onRequest } from "../functions/_middleware.js";
import {
  BLOCKED_PUBLIC_FILE_STEMS,
  BLOCKED_PUBLIC_PREFIXES,
  CLOUDFLARE_FUNCTION_EXCLUDES,
  CLOUDFLARE_FUNCTION_ROUTES,
  PRIVATE_RUNTIME_PREFIXES,
  PRIVATE_RUNTIME_PATHS,
  PUBLIC_RUNTIME_EXCEPTIONS,
} from "../scripts/publication-denylist.mjs";
import { SECURITY_HEADERS } from "../scripts/security-headers.mjs";

test("publication middleware blocks every retired, withheld, and private path", () => {
  for (const prefix of BLOCKED_PUBLIC_PREFIXES) {
    assert.equal(isBlockedPublicPath(`/${prefix}`), true, prefix);
    if (prefix.endsWith("/")) {
      assert.equal(isBlockedPublicPath(`/${prefix}nested-file.webp`), true, prefix);
    }
  }
  for (const prefix of PRIVATE_RUNTIME_PREFIXES) {
    assert.equal(isBlockedPublicPath(`/${prefix}old-build-input.json`), true, prefix);
  }
  for (const filePath of PRIVATE_RUNTIME_PATHS) {
    assert.equal(isBlockedPublicPath(`/${filePath}`), true, filePath);
  }
  for (const stem of BLOCKED_PUBLIC_FILE_STEMS) {
    assert.equal(isBlockedPublicPath(`/${stem}.webp`), true, stem);
    assert.equal(isBlockedPublicPath(`/${stem}-320w.webp`), true, stem);
    assert.equal(isBlockedPublicPath(`/${stem}-1600w.webp`), true, stem);
  }

  assert.equal(isBlockedPublicPath("/WORK/BETA-ANDREW/"), true);
  assert.equal(isBlockedPublicPath("/work/%62eta-emma/"), true);
  assert.equal(isBlockedPublicPath("/work/flight-paths/"), false);
  for (const exception of PUBLIC_RUNTIME_EXCEPTIONS) {
    assert.equal(isBlockedPublicPath(`/${exception}`), false, exception);
  }
});

test("publication middleware returns an uncached 404 before a blocked asset can load", async () => {
  let nextCalls = 0;
  const blockedResponse = await onRequest({
    request: new Request("https://ames.consulting/work/beta-andrew/"),
    next: () => {
      nextCalls += 1;
      return new Response("stale asset");
    },
  });

  assert.equal(blockedResponse.status, 404);
  assert.equal(blockedResponse.headers.get("cache-control"), "no-store");
  assert.match(blockedResponse.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(blockedResponse.headers.get("strict-transport-security"), /; preload$/);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    assert.equal(blockedResponse.headers.get(name), value, name);
  }
  assert.equal(blockedResponse.headers.get("x-ames-tombstone"), "1");
  assert.equal(blockedResponse.headers.get("x-robots-tag"), "noindex");
  assert.equal(nextCalls, 0);

  const publicResponse = await onRequest({
    request: new Request("https://ames.consulting/work/flight-paths/"),
    next: () => {
      nextCalls += 1;
      return new Response("public asset");
    },
  });
  assert.equal(publicResponse.status, 200);
  assert.equal(await publicResponse.text(), "public asset");
  assert.equal(nextCalls, 1);
});

test("Cloudflare invokes Functions only for the API and blocked publication paths", () => {
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES[0].startsWith("/"), true);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.includes("/api/*"), true);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.includes("/assets/data/*"), true);
  assert.equal(
    CLOUDFLARE_FUNCTION_ROUTES.includes("/assets/images/work/campaigns/flight-paths*"),
    true,
  );
  assert.equal(
    CLOUDFLARE_FUNCTION_ROUTES.includes("/assets/images/work/portraits/beth-roberts*"),
    true,
  );
  assert.equal(
    CLOUDFLARE_FUNCTION_ROUTES.includes("/assets/images/work/portraits/gallery/blue-cross/*"),
    true,
  );
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.includes("/assets/images/work/campaigns/*"), false);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.includes("/assets/images/work/portraits/*"), false);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.includes("/work/beta-andrew/*"), true);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.includes("/work/flight-paths/*"), false);
  assert.deepEqual(CLOUDFLARE_FUNCTION_EXCLUDES, ["/assets/data/site.config.json"]);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.length <= 100, true);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.every((route) => route.startsWith("/")), true);
  assert.equal(CLOUDFLARE_FUNCTION_ROUTES.every((route) => route.length <= 100), true);
  assert.equal(CLOUDFLARE_FUNCTION_EXCLUDES.every((route) => route.length <= 100), true);
  assert.equal(new Set(CLOUDFLARE_FUNCTION_ROUTES).size, CLOUDFLARE_FUNCTION_ROUTES.length);
});
