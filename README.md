# Organic Workflow — Trades Partner Recruiting Site

Marketing site for **Organic Workflow**, which partners with licensed trades professionals who want
to be their own boss. The tradesperson brings the craft and the license; Organic Workflow prices
jobs, runs marketing, closes work, hires crews, and manages the business side.

Production domain: **organicworkflow.com** (Cloudflare Pages)

---

## Stack

- Static HTML / CSS / vanilla JS — no build step, no framework, no dependencies
- Fonts: Cabinet Grotesk (display) + Satoshi (body) via Fontshare CDN
- Animated parallax cloud background (three layers of transparent WebP, CSS `transform` keyframes,
  honors `prefers-reduced-motion`)
- Light + dark mode (system preference with an in-page toggle)
- Application form posts to a Cloudflare Pages Function that sends mail through Resend

## Project layout

```
.
├── index.html              single-page site
├── base.css                reset + primitives
├── style.css               design tokens (OKLCH) + components
├── app.js                  theme toggle, mobile nav, scroll reveal, form submit
├── _headers                Cloudflare Pages security + cache headers
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── clouds-far.webp     background cloud layer (transparent)
│   ├── clouds-near.webp    background cloud layer (transparent)
│   ├── hero-tradesman.jpg
│   ├── partnership.jpg
│   ├── tradeswoman.jpg
│   └── favicon.jpg
└── functions/
    └── api/
        └── lead.js         POST /api/lead → Resend
```

## Local development

No toolchain required — serve the directory:

```bash
python3 -m http.server 4321
# http://localhost:4321
```

The form endpoint does not exist when serving statically, so submissions fall back to the
"email us directly" message. To exercise the function locally:

```bash
npx wrangler pages dev . --binding RESEND_API_KEY=re_your_key
```

## Deploying to Cloudflare Pages

Account ID: `f1f4b62c22dce08df449a1412594c3be`

```bash
npx wrangler pages deploy . --project-name organicworkflow --branch main
```

### Required environment variables

Set these on the Pages project (Settings → Variables and Secrets) for **both** Production and
Preview:

| Variable         | Required | Notes                                                              |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `RESEND_API_KEY` | yes      | Resend API key. Store as a **secret**.                             |
| `LEAD_TO`        | no       | Defaults to `justus@organicworkflow.com`                           |
| `LEAD_FROM`      | no       | Defaults to `Organic Workflow <apply@organicworkflow.com>`         |

`LEAD_FROM` must use a domain verified in Resend. Verify `organicworkflow.com` in Resend and add the
DKIM/SPF records to the Cloudflare DNS zone before going live, otherwise delivery will fail.

### Custom domain

In the Pages project → Custom domains, add `organicworkflow.com` and `www.organicworkflow.com`.
Cloudflare creates the DNS records automatically when the zone is in the same account.

## Form endpoint contract

`POST /api/lead` — JSON body:

| Field        | Required | Notes                              |
| ------------ | -------- | ---------------------------------- |
| `name`       | yes      |                                    |
| `email`      | yes      | validated; used as `reply_to`      |
| `phone`      | yes      |                                    |
| `city`       | yes      | city / market                      |
| `trade`      | yes      |                                    |
| `experience` | yes      | years in the trade                 |
| `license`    | yes      | license or certification           |
| `message`    | no       | free text                          |
| `consent`    | yes      | must be boolean `true`             |
| `page`       | no       | submitting URL, included in email  |

Responses: `200 {"ok":true}`, `400` validation, `500` unconfigured, `502` delivery failure. No
submission data is stored anywhere — it is emailed and discarded.

## Editing content

All copy lives in `index.html`. Common edits:

- **Trades list** — the `.strip__track` marquee and the `#trade` `<select>` options
- **Four pillars** (pricing / hiring / marketing / closing) — the `.cards` block in `#what-we-run`
- **FAQ** — `<details>` elements in `#faq`
- **Brand colors** — the `:root` and `[data-theme="dark"]` blocks at the top of `style.css`
- **Cloud speed** — the `drift` animation durations on `.sky__band--far|mid|near` in `style.css`
