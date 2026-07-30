/**
 * Cloudflare Pages Function — POST /api/lead
 * Sends partner applications to justus@organicworkflow.com via Resend.
 *
 * Required environment variables (Pages project → Settings → Variables):
 *   RESEND_API_KEY   Resend API key (secret)
 *   LEAD_TO          optional, defaults to justus@organicworkflow.com
 *   LEAD_FROM        optional, defaults to "Organic Workflow <apply@organicworkflow.com>"
 */

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch (_) {
    return json({ error: "Invalid request body." }, 400);
  }

  const field = (k) => (typeof data[k] === "string" ? data[k].trim().slice(0, 4000) : "");
  const name = field("name");
  const email = field("email");
  const phone = field("phone");
  const city = field("city");
  const trade = field("trade");
  const experience = field("experience");
  const license = field("license");
  const message = field("message");

  if (!name || !email || !phone || !city || !trade) {
    return json({ error: "Missing required fields." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (data.consent !== true) {
    return json({ error: "Consent is required." }, 400);
  }
  if (!env.RESEND_API_KEY) {
    return json({ error: "Email service is not configured." }, 500);
  }

  const to = env.LEAD_TO || "justus@organicworkflow.com";
  const from = env.LEAD_FROM || "Organic Workflow <apply@organicworkflow.com>";

  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["City", city],
    ["Trade", trade],
    ["Years in trade", experience || "not given"],
    ["License / certification", license || "not given"],
    ["Goals", message || "—"],
    ["Submitted from", field("page") || "organicworkflow.com"],
  ];

  const html = `<!doctype html><html><body style="margin:0;background:#f2f5fa;padding:28px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#26314a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #dde4f0;border-radius:14px;overflow:hidden">
    <tr><td style="background:#3560b8;padding:20px 26px;color:#fff">
      <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.82">Organic Workflow</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px">New partner inquiry</div>
    </td></tr>
    <tr><td style="padding:24px 26px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:9px 0;border-bottom:1px solid #eef1f7;color:#66718c;width:180px;vertical-align:top">${esc(
                k
              )}</td><td style="padding:9px 0;border-bottom:1px solid #eef1f7;font-weight:600;vertical-align:top">${esc(
                v
              ).replace(/\n/g, "<br>")}</td></tr>`
          )
          .join("")}
      </table>
      <p style="margin:22px 0 0;font-size:13px;color:#66718c">Reply directly to this email to reach the applicant.</p>
    </td></tr>
  </table></body></html>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `New partner inquiry — ${name} (${trade}, ${city})`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.log("Resend error", res.status, detail);
      return json({ error: "Email delivery failed." }, 502);
    }
  } catch (err) {
    console.log("Resend exception", String(err));
    return json({ error: "Email delivery failed." }, 502);
  }

  return json({ ok: true });
}

export async function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
