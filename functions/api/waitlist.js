// Cloudflare Pages Function — POST /api/waitlist
// Persists the contact in Supabase (dedup by email via upsert_contact), then sends
// a confirmation email to the signer and an enriched internal notification.
// DB write success is independent of email send success — email failures are
// logged but never fail the request, so a signup is never lost over a flaky send.
import { upsertContact } from '../_lib/supabase.js';
import { sendEmail, waitlistConfirmationEmail, waitlistInternalNotificationEmail } from '../_lib/emails.js';

function splitName(name) {
  const parts = String(name).trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const {
    name, email, phone, audience_type,
    marketing_consent, utm_source, utm_medium, utm_campaign, utm_content, referrer, source,
  } = data;

  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!env.RESEND_API_KEY || !env.WAITLIST_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Waitlist is not configured yet' }), { status: 503 });
  }

  const { firstName, lastName } = splitName(name);
  const createdAt = new Date().toISOString();

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await upsertContact(env, {
        firstName,
        lastName,
        email,
        phone,
        signupType: 'waitlist',
        marketingConsent: marketing_consent,
        source: source || 'waitlist_form',
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmCampaign: utm_campaign,
        utmContent: utm_content,
        referrer,
      });
    } catch (err) {
      console.error('waitlist upsertContact failed', err);
    }
  }

  const siteUrl = env.PUBLIC_SITE_URL || 'https://nairobiesportsexpo.co.ke';

  try {
    const confirmation = waitlistConfirmationEmail({ firstName, siteUrl });
    await sendEmail(env, { to: email, ...confirmation });
  } catch (err) {
    console.error('waitlist confirmation email failed', err);
  }

  try {
    const notification = waitlistInternalNotificationEmail({
      firstName, lastName, email, phone, source: source || 'waitlist_form', audienceType: audience_type, createdAt, siteUrl,
    });
    await sendEmail(env, { to: env.WAITLIST_TO_EMAIL, replyTo: email, ...notification });
  } catch (err) {
    console.error('waitlist internal notification failed', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
