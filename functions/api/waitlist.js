// Cloudflare Pages Function — POST /api/waitlist
// Requires a RESEND_API_KEY secret and a WAITLIST_TO_EMAIL env var.
// Structured to be swapped later for a CRM/email-marketing/DB webhook —
// only the fetch target below needs to change; the payload shape stays stable.
export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { name, email, phone, audience_type } = data;

  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!env.RESEND_API_KEY || !env.WAITLIST_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Waitlist is not configured yet' }), { status: 503 });
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nairobi Esports Expo <noreply@nairobiesportsexpo.co.ke>',
      to: [env.WAITLIST_TO_EMAIL],
      reply_to: email,
      subject: `Waitlist signup: ${name} (${audience_type || 'n/a'})`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'n/a'}\nAudience type: ${audience_type || 'n/a'}`,
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
