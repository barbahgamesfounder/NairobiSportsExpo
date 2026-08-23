// Cloudflare Pages Function — POST /api/express-interest
// Requires a RESEND_API_KEY secret and an INTEREST_TO_EMAIL env var.
// Structured to be swapped later for a CRM/email-marketing/DB webhook —
// only the fetch target below needs to change; the payload shape stays stable.
export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const {
    organisation, name, job_title, email, phone,
    organisation_type, engagement_interests, message,
  } = data;

  if (!organisation || !name || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!env.RESEND_API_KEY || !env.INTEREST_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Express Interest form is not configured yet' }), { status: 503 });
  }

  const interests = Array.isArray(engagement_interests)
    ? engagement_interests.join(', ')
    : (engagement_interests || 'n/a');

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nairobi Esports Expo <noreply@nairobiesportsexpo.co.ke>',
      to: [env.INTEREST_TO_EMAIL],
      reply_to: email,
      subject: `Expression of interest: ${organisation}`,
      text: `Organisation: ${organisation}\nName: ${name}\nJob title: ${job_title || 'n/a'}\nEmail: ${email}\nPhone: ${phone || 'n/a'}\nOrganisation type: ${organisation_type || 'n/a'}\nEngagement interests: ${interests}\n\nMessage:\n${message || 'n/a'}`,
    }),
  });

  if (!resendRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to submit' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
