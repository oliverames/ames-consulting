const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL) return json({ error: "Email service unavailable" }, 503);

  const data = await request.formData();
  const website = String(data.get("companyWebsite") || "").trim();
  if (website) return json({ ok: true });

  const name = String(data.get("name") || "").trim().slice(0, 120);
  const email = String(data.get("email") || "").trim().slice(0, 254);
  const message = String(data.get("message") || "").trim().slice(0, 6000);
  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: "Please complete every field" }, 400);
  }

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
      html: `<h1>New website inquiry</h1><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
      text: `New website inquiry\n\nFrom: ${name} <${email}>\n\n${message}`
    })
  });

  if (!response.ok) return json({ error: "Message could not be sent" }, 502);
  return json({ ok: true });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, 405);
}
