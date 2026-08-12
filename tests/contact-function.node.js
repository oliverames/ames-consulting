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
  name = "Test Visitor",
} = {}) {
  const body = new FormData();
  body.set("name", name);
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

test("contact function rejects oversized submissions and implausible timestamps", async () => {
  const oversized = await onRequestPost({
    request: contactRequest({ contentLength: 25_001 }),
    env,
  });
  assert.equal(oversized.status, 413);

  const farFuture = await onRequestPost({
    request: contactRequest({ startedAt: Date.now() + 10 * 60 * 1000 }),
    env,
  });
  assert.equal(farFuture.status, 400);
  assert.equal((await farFuture.json()).error, "Please refresh the form and try again");

  const missing = await onRequestPost({
    request: contactRequest({ startedAt: 0 }),
    env,
  });
  assert.equal(missing.status, 400);
});

test("contact function tolerates a visitor clock running slightly ahead", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact", hostname: "ames.consulting" });
    }
    return Response.json({ id: "test-message" });
  };

  try {
    const response = await onRequestPost({
      request: contactRequest({ startedAt: Date.now() + 2 * 60 * 1000 }),
      env,
    });
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
      return Response.json({ success: true, action: "contact", hostname: "ames.consulting" });
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

test("contact function rejects a Turnstile token solved on another hostname", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact", hostname: "evil.example" });
    }
    throw new Error("Resend should not be called for a mismatched hostname");
  };

  try {
    const response = await onRequestPost({ request: contactRequest(), env });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "Spam protection check failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact function returns clean JSON when Turnstile verification is unreachable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      throw new TypeError("network error");
    }
    throw new Error("Resend should not be called when verification fails");
  };

  try {
    const response = await onRequestPost({ request: contactRequest(), env });
    assert.equal(response.status, 502);
    assert.equal(
      (await response.json()).error,
      "Verification service is unavailable right now",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact function returns clean JSON when the email service is unreachable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact", hostname: "ames.consulting" });
    }
    throw new TypeError("network error");
  };

  try {
    const response = await onRequestPost({ request: contactRequest(), env });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, "Message could not be sent");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact function removes control characters from the outbound subject", async () => {
  const originalFetch = globalThis.fetch;
  let outboundEmail;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact", hostname: "ames.consulting" });
    }
    if (String(url) === "https://api.resend.com/emails") {
      outboundEmail = JSON.parse(options.body);
      return Response.json({ id: "test-message" });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const response = await onRequestPost({
      request: contactRequest({ name: "Jane\r\nBcc: visitor@example.com\u0000" }),
      env,
    });
    assert.equal(response.status, 200);
    assert.equal(
      outboundEmail.subject,
      "Website inquiry from Jane Bcc: visitor@example.com",
    );
    assert.doesNotMatch(outboundEmail.subject, /[\u0000-\u001F\u007F]/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
