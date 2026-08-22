# Nairobi Sports Expo

Static landing page for nairobisportsexpo.co.ke, built for Cloudflare Pages.

## Structure

- `index.html`, `styles.css`, `script.js` — the site
- `functions/api/contact.js` — Cloudflare Pages Function handling the contact form via Resend

## Local development

```bash
npx wrangler pages dev .
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: Workers & Pages → Create → Pages → connect the repo. Build command: none. Output directory: `/`.
3. Set secrets/env vars for the contact form (Pages project → Settings → Environment variables):
   - `RESEND_API_KEY` — your Resend API key
   - `CONTACT_TO_EMAIL` — where contact form submissions should be sent
4. Point DNS: in Cloudflare DNS for `nairobisportsexpo.co.ke`, the Pages project setup will give you a CNAME/A record to add (or "Set up a custom domain" from the Pages project, which configures it for you if the zone is on Cloudflare).
5. Since the domain is registered at Truehost, either transfer DNS management to Cloudflare (add the domain as a Cloudflare zone, then update nameservers at Truehost to Cloudflare's), or add a CNAME at Truehost pointing to your `*.pages.dev` URL if Truehost allows CNAME at the root (many registrars don't — using Cloudflare as the DNS host is the reliable path).

## TODO before launch

- Replace placeholder event dates, venue, and exhibitor logos
- Confirm contact email address
- Add real sponsor/exhibitor logos to the Exhibitors section
