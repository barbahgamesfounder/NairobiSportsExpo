// Cloudflare Pages Function — POST /api/partners
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
    organisation, website, industry, name, job_title, email, phone,
    interests, goal, timeline,
  } = data;

  if (!organisation || !name || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!env.RESEND_API_KEY || !env.INTEREST_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Partner interest form is not configured yet' }), { status: 503 });
  }

  const interestList = Array.isArray(interests) ? interests.join(', ') : (interests || 'n/a');

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
      subject: `Partner interest: ${organisation}`,
      text: `Organisation: ${organisation}\nWebsite: ${website || 'n/a'}\nIndustry: ${industry || 'n/a'}\nName: ${name}\nRole / Job title: ${job_title || 'n/a'}\nEmail: ${email}\nPhone: ${phone || 'n/a'}\nInterested in: ${interestList}\nTimeline: ${timeline || 'n/a'}\n\nWhat they'd like to achieve:\n${goal || 'n/a'}`,
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
