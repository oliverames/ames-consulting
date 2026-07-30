import { test, expect } from "@playwright/test";
import { onRequestPost } from "../functions/api/contact.js";

test("contact email replies to the prospective client", async () => {
  const originalFetch = globalThis.fetch;
  let outboundEmail;
  globalThis.fetch = async (_url, options) => {
    outboundEmail = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  };

  try {
    const form = new FormData();
    form.set("name", "Prospective Client");
    form.set("email", "client@example.com");
    form.set("message", "I would like to discuss a photography project.");

    const response = await onRequestPost({
      request: new Request("https://ames.consulting/api/contact", {
        method: "POST",
        body: form,
      }),
      env: {
        RESEND_API_KEY: "test-key",
        CONTACT_EMAIL: "oliver@ames.consulting",
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
