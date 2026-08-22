// Cloudflare Pages Function — POST /api/contact
// Requires a RESEND_API_KEY secret (wrangler pages secret put RESEND_API_KEY)
// and a CONTACT_TO_EMAIL env var for the recipient address.
export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { name, email, interest, message } = data;

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Contact form is not configured yet' }), { status: 503 });
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nairobi Sports Expo <noreply@nairobisportsexpo.co.ke>',
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `New expo inquiry: ${interest || 'general'} — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nInterest: ${interest || 'n/a'}\n\n${message}`,
    }),
  });

  if (!resendRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
