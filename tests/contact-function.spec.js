import { test, expect } from "@playwright/test";
import { onRequestPost } from "../functions/api/contact.js";

test("contact email replies to the prospective client", async () => {
  const originalFetch = globalThis.fetch;
  let outboundEmail;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("/turnstile/v0/siteverify")) {
      return Response.json({ success: true, action: "contact" });
    }
    outboundEmail = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  };

  try {
    const form = new FormData();
    form.set("name", "Prospective Client");
    form.set("email", "client@example.com");
    form.set("message", "I would like to discuss a photography project.");
    form.set("startedAt", String(Date.now() - 5_000));
    form.set("cf-turnstile-response", "verified-test-token");

    const response = await onRequestPost({
      request: new Request("https://ames.consulting/api/contact", {
        method: "POST",
        headers: { Origin: "https://ames.consulting" },
        body: form,
      }),
      env: {
        RESEND_API_KEY: "test-key",
        CONTACT_EMAIL: "oliver@ames.consulting",
        TURNSTILE_SECRET_KEY: "test-secret",
      },
    });

    expect(response.status).toBe(200);
    expect(outboundEmail.to).toEqual(["oliver@ames.consulting"]);
    expect(outboundEmail.reply_to).toBe("client@example.com");
    expect(outboundEmail.from).not.toContain("client@example.com");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact endpoint rejects a failed Turnstile check before sending email", async () => {
  const originalFetch = globalThis.fetch;
  let emailAttempted = false;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/turnstile/v0/siteverify")) {
      return Response.json({ success: false, "error-codes": ["invalid-input-response"] });
    }
    emailAttempted = true;
    return Response.json({ id: "unexpected-email" });
  };

  try {
    const form = new FormData();
    form.set("name", "Suspicious Sender");
    form.set("email", "sender@example.com");
    form.set("message", "This request should not reach Resend.");
    form.set("startedAt", String(Date.now() - 5_000));
    form.set("cf-turnstile-response", "invalid-test-token");

    const response = await onRequestPost({
      request: new Request("https://ames.consulting/api/contact", {
        method: "POST",
        headers: { Origin: "https://ames.consulting" },
        body: form,
      }),
      env: {
        RESEND_API_KEY: "test-key",
        CONTACT_EMAIL: "oliver@ames.consulting",
        TURNSTILE_SECRET_KEY: "test-secret",
      },
    });

    expect(response.status).toBe(403);
    expect(emailAttempted).toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
