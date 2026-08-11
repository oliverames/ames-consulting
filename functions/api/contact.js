const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 25_000;

function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function verifyTurnstile({ token, secret, remoteIp }) {
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body
  });
  if (!response.ok) return false;

  const result = await response.json();
  return result.success === true && result.action === "contact";
}

async function readBoundedBody(request) {
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel("Request body exceeds the contact form limit").catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function readFormData(request) {
  const body = await readBoundedBody(request);
  if (!body) return null;

  const contentType = request.headers.get("Content-Type");
  if (!contentType) throw new TypeError("Missing content type");
  return new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body
  }).formData();
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: "Request origin is not allowed" }, 403);

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: "Message is too large" }, 413);
  }

  let data;
  try {
    data = await readFormData(request);
  } catch {
    return json({ error: "Request body is not valid form data" }, 400);
  }
  if (!data) return json({ error: "Message is too large" }, 413);
  const website = String(data.get("companyWebsite") || "").trim();
  if (website) return json({ ok: true });

  const name = String(data.get("name") || "").trim().slice(0, 120);
  const email = String(data.get("email") || "").trim().slice(0, 254);
  const message = String(data.get("message") || "").trim().slice(0, 6000);
  const organization = String(data.get("organization") || "").trim().slice(0, 160);
  const projectType = String(data.get("projectType") || "").trim().slice(0, 120);
  const timeframe = String(data.get("timeframe") || "").trim().slice(0, 120);
  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: "Please complete every field" }, 400);
  }

  const startedAt = Number(data.get("startedAt") || 0);
  const fillTime = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || fillTime < MIN_FILL_MS || fillTime > MAX_FILL_MS) {
    return json({ error: "Please refresh the form and try again" }, 400);
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL) return json({ error: "Email service unavailable" }, 503);
  if (!env.TURNSTILE_SECRET_KEY) return json({ error: "Spam protection unavailable" }, 503);

  const turnstileToken = String(data.get("cf-turnstile-response") || "").trim();
  if (!turnstileToken) return json({ error: "Please complete the spam protection check" }, 400);

  const turnstileValid = await verifyTurnstile({
    token: turnstileToken,
    secret: env.TURNSTILE_SECRET_KEY,
    remoteIp: request.headers.get("CF-Connecting-IP") || ""
  });
  if (!turnstileValid) return json({ error: "Spam protection check failed" }, 403);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID()
    },
    body: JSON.stringify({
      from: "Ames Consulting Website <website@amesvt.com>",
      to: [env.CONTACT_EMAIL],
      reply_to: email,
      subject: `Website inquiry from ${name}`,
      html: `<h1>New website inquiry</h1><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>${organization ? `<p><strong>Organization:</strong> ${escapeHtml(organization)}</p>` : ""}${projectType ? `<p><strong>Work:</strong> ${escapeHtml(projectType)}</p>` : ""}${timeframe ? `<p><strong>Timing:</strong> ${escapeHtml(timeframe)}</p>` : ""}<p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
      text: `New website inquiry\n\nFrom: ${name} <${email}>${organization ? `\nOrganization: ${organization}` : ""}${projectType ? `\nWork: ${projectType}` : ""}${timeframe ? `\nTiming: ${timeframe}` : ""}\n\n${message}`
    })
  });

  if (!response.ok) return json({ error: "Message could not be sent" }, 502);
  return json({ ok: true });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, 405);
}
