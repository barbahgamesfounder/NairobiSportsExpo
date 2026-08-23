# Nairobi Esports Expo

Multi-page site for nairobiesportsexpo.co.ke, built for Cloudflare Pages.

## Structure

Static HTML per route (Pages auto-resolves `/route` → `route.html`):

- `index.html` — `/`
- `the-expo.html` — `/the-expo`
- `experience.html` — `/experience`
- `esports-ecosystem.html` — `/esports-ecosystem`
- `sdg-quest.html` — `/sdg-quest`
- `beyond-2030.html` — `/beyond-2030`
- `express-interest.html` — `/express-interest` (business conversion form)
- `waitlist.html` — `/waitlist` (public signup form)
- `styles.css`, `script.js` — shared design system, nav, scroll-reveal, generic form handler
- `functions/api/waitlist.js` — Cloudflare Pages Function, sends via Resend
- `functions/api/express-interest.js` — Cloudflare Pages Function, sends via Resend

Only two site-wide CTAs: **Get on the Waitlist** and **Express Interest**. No ticket checkout.

Routes reserved for later but not yet built or linked in nav: `/events`, `/programme`, `/speakers`, `/exhibitors`, `/partners`, `/news`, `/gallery`, `/faq`, `/contact`.

## Local development

```bash
npx wrangler pages dev .
```

## Deploy

```bash
npx wrangler pages deploy . --project-name nairobi-esports-expo --branch master
```

Env vars needed (Pages project → Settings → Environment variables):

- `RESEND_API_KEY` — Resend API key
- `WAITLIST_TO_EMAIL` — recipient for waitlist signups
- `INTEREST_TO_EMAIL` — recipient for express-interest submissions

Forms are structured so the fetch target inside each function can later be swapped for a CRM/email-marketing/Airtable/Supabase/webhook integration without changing the form payload shape. No credentials are hardcoded — everything comes from environment variables.

## Cache-busting

Static asset references use `?v=N` query strings (see `<link>`/`<script>`/`<img>` tags). Bump the version number whenever you edit `styles.css`, `script.js`, or a swapped image, so Cloudflare's edge and browser caches don't serve a stale copy.
