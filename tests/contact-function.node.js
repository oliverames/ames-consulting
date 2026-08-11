import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/contact.js";

const env = {
  CONTACT_EMAIL: "oliver@example.com",
  RESEND_API_KEY: "test-resend-key",
  TURNSTILE_SECRET_KEY: "test-turnstile-key",
};

function contactRequest({
  origin = "https://ames.consulting",
  startedAt = Date.now() - 5_000,
  contentLength,
} = {}) {
  const body = new FormData();
  body.set("name", "Test Visitor");
  body.set("email", "visitor@example.com");
  body.set("message", "This is an isolated function test.");
  body.set("startedAt", String(startedAt));
  body.set("cf-turnstile-response", "test-token");
  const headers = { Origin: origin };
  if (contentLength != null) headers["Content-Length"] = String(contentLength);
  return new Request("https://ames.consulting/api/contact", {
    method: "POST",
    headers,
    body,
  });
}

test("contact function rejects cross-origin submissions before external calls", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("External fetch should not run");
  };

  try {
    const response = await onRequestPost({
      request: contactRequest({ origin: "https://example.com" }),
      env,
    });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "Request origin is not allowed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact function rejects oversized and implausibly fast submissions", async () => {
  const oversized = await onRequestPost({
    request: contactRequest({ contentLength: 25_001 }),
    env,
  });
  assert.equal(oversized.status, 413);

  const tooFast = await onRequestPost({
    request: contactRequest({ startedAt: Date.now() }),
    env,
  });
  assert.equal(tooFast.status, 400);
  assert.equal((await tooFast.json()).error, "Please refresh the form and try again");
});

test("contact function measures the body when content length is absent", async () => {
  const body = new URLSearchParams({
    name: "Test Visitor",
    email: "visitor@example.com",
    message: "x".repeat(25_001),
    startedAt: String(Date.now() - 5_000),
    "cf-turnstile-response": "test-token",
  });
  const request = new Request("https://ames.consulting/api/contact", {
    method: "POST",
    headers: { Origin: "https://ames.consulting" },
    body,
  });

  const response = await onRequestPost({ request, env });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, "Message is too large");
});

test("contact function stops reading an oversized streaming body", async () => {
  let pulls = 0;
  const body = new ReadableStream({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(10_000).fill(120));
      if (pulls === 10) controller.close();
    },
  });
  const request = new Request("https://ames.consulting/api/contact", {
    method: "POST",
    headers: {
      Origin: "https://ames.consulting",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    duplex: "half",
  });

  const response = await onRequestPost({ request, env });
  assert.equal(response.status, 413);
  assert.ok(pulls < 10, `Expected the stream to stop early, but it read ${pulls} chunks.`);
});

test("contact function verifies Turnstile before sending a valid message", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact" });
    }
    if (String(url) === "https://api.resend.com/emails") {
      return Response.json({ id: "test-message" });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const response = await onRequestPost({ request: contactRequest(), env });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.deepEqual(calls, [
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      "https://api.resend.com/emails",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
