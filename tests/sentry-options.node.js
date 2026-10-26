import assert from "node:assert/strict";
import test from "node:test";
import { beforeSend, sentryOptions } from "../scripts/sentry-options.mjs";

test("Sentry is off without a DSN and collects nothing", () => {
  const options = sentryOptions({});
  assert.equal(options.dsn, undefined);
  assert.equal(options.tracesSampleRate, 0);
  assert.equal(options.environment, "production");
  const { userInfo, cookies, httpHeaders, urlQueryParams, httpBodies } = options.dataCollection;
  assert.deepEqual([userInfo, cookies, httpHeaders, urlQueryParams, httpBodies], [false, false, false, false, []]);
  assert.equal(options.beforeBreadcrumb(), null);
});

test("beforeSend keeps only the request method and path and scrubs messages", () => {
  const token = "0.".concat("t".repeat(60));
  const event = beforeSend({
    request: { method: "POST", url: "https://ames.consulting/api/contact?ref=SECRET", data: "name=Jane+Visitor&email=jane%40example.com&message=SECRET", headers: { Cookie: "x=SECRET" }, cookies: { x: "SECRET" }, query_string: "ref=SECRET" },
    user: { ip_address: "203.0.113.9" },
    breadcrumbs: [{ category: "fetch", data: { url: "https://api.resend.com/emails" } }],
    contexts: { culture: { timezone: "America/New_York" }, runtime: { name: "cloudflare" } },
    exception: { values: [{ type: "Error", value: `reply to jane@example.com failed with ${token} at https://api.resend.com/emails?x=SECRET`, stacktrace: { frames: [{ filename: "/Users/someone/ames-consulting/.wrangler/tmp/functionsWorker.js", abs_path: "/Users/someone/ames-consulting/.wrangler/tmp/functionsWorker.js" }] } }] },
  });
  assert.deepEqual(event.request, { method: "POST", url: "https://ames.consulting/api/contact" });
  assert.equal(event.user, undefined);
  assert.deepEqual(event.contexts, { runtime: { name: "cloudflare" } });
  assert.equal(event.exception.values[0].value, "reply to [email] failed with [token] at https://api.resend.com/emails");
  assert.equal(event.exception.values[0].stacktrace.frames[0].filename, "functionsWorker.js");
  assert.doesNotMatch(JSON.stringify(event), /SECRET|tttttttttt|Jane|example\.com|203\.0\.113|someone/);
});
