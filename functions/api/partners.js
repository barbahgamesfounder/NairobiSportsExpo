// Cloudflare Pages Function — POST /api/partners
// Persists the contact + partner_interests in Supabase (dedup by email), scores
// the lead, then sends a confirmation email to the partner and an enriched
// internal notification. DB write success is independent of email send success.
import { upsertContact, insertPartnerInterest } from '../_lib/supabase.js';
import { sendEmail, partnerConfirmationEmail, partnerInternalNotificationEmail } from '../_lib/emails.js';
import { computeLeadScoreDelta } from '../_lib/scoring.js';

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const {
    organisation, website, industry, name, job_title, email, phone,
    interests, goal, timeline,
    marketing_consent, utm_source, utm_medium, utm_campaign, utm_content, referrer, source,
  } = data;

  if (!organisation || !name || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!env.RESEND_API_KEY || !env.INTEREST_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Partner interest form is not configured yet' }), { status: 503 });
  }

  const interestList = Array.isArray(interests) ? interests : (interests ? [interests] : []);
  const leadScoreDelta = computeLeadScoreDelta(interestList);
  const createdAt = new Date().toISOString();

  let contact = null;
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      contact = await upsertContact(env, {
        firstName: name,
        email,
        phone,
        organisationName: organisation,
        organisationType: industry,
        jobTitle: job_title,
        signupType: 'partner_interest',
        marketingConsent: marketing_consent,
        source: source || 'partners_form',
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmCampaign: utm_campaign,
        utmContent: utm_content,
        referrer,
      }, leadScoreDelta);

      if (contact?.id) {
        await insertPartnerInterest(env, {
          contact_id: contact.id,
          interest_type: interestList.join(', ') || null,
          message: goal || null,
          website: website || null,
          timeline: timeline || null,
        });
      }
    } catch (err) {
      console.error('partners upsertContact/insertPartnerInterest failed', err);
    }
  }

  const siteUrl = env.PUBLIC_SITE_URL || 'https://nairobiesportsexpo.co.ke';

  try {
    const confirmation = partnerConfirmationEmail({ contactName: name, organisationName: organisation, siteUrl });
    await sendEmail(env, { to: email, ...confirmation });
  } catch (err) {
    console.error('partner confirmation email failed', err);
  }

  try {
    const notification = partnerInternalNotificationEmail({
      organisationName: organisation,
      organisationType: industry,
      contactName: name,
      jobTitle: job_title,
      email,
      phone,
      website,
      interests: interestList,
      timeline,
      message: goal,
      leadScore: contact?.lead_score ?? leadScoreDelta,
      leadPriority: contact?.lead_priority,
      source: source || 'partners_form',
      createdAt,
      siteUrl,
    });
    await sendEmail(env, { to: env.INTEREST_TO_EMAIL, replyTo: email, ...notification });
  } catch (err) {
    console.error('partner internal notification failed', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
