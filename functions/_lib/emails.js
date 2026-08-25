// Resend send wrapper + reusable on-brand email templates.
// Deep/black background, purple esports accent, gold accent, mobile-responsive.

const BRAND = {
  bg: '#0b0b12',
  panel: '#15151f',
  text: '#f5f5fa',
  muted: '#a6a6b8',
  purple: '#8b5cf6',
  gold: '#f5c451',
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function layout({ preheader, heading, bodyHtml, ctaLabel, ctaUrl }) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Segoe UI,Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:${BRAND.panel};border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 32px 0;">
<p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.gold};font-weight:600;">Nairobi Esports Expo</p>
</td></tr>
<tr><td style="padding:12px 32px 0;">
<h1 style="margin:0;font-size:22px;line-height:1.3;color:${BRAND.text};">${heading}</h1>
</td></tr>
<tr><td style="padding:16px 32px 8px;color:${BRAND.muted};font-size:15px;line-height:1.6;">
${bodyHtml}
</td></tr>
${ctaLabel && ctaUrl ? `<tr><td style="padding:8px 32px 28px;">
<a href="${ctaUrl}" style="display:inline-block;background:${BRAND.purple};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
</td></tr>` : `<tr><td style="padding:8px 32px 28px;"></td></tr>`}
<tr><td style="padding:16px 32px 24px;border-top:1px solid #26263a;">
<p style="margin:0;font-size:12px;color:${BRAND.muted};">Nairobi Esports Expo &middot; Kenya</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function waitlistConfirmationEmail({ firstName, siteUrl }) {
  const name = firstName ? escapeHtml(firstName) : 'there';
  const heading = "You're on the Nairobi Esports Expo waitlist 🎮";
  const bodyHtml = `<p>Hi ${name},</p>
<p>Thanks for signing up — you're officially on the waitlist for the Nairobi Esports Expo, where gaming meets skills, opportunity and the Sustainable Development Goals.</p>
<p>We'll keep you posted on dates, experiences and how to get involved. Get ready.</p>`;
  return {
    subject: heading,
    html: layout({ preheader: heading, heading, bodyHtml, ctaLabel: 'Visit the site', ctaUrl: siteUrl }),
    text: `Hi ${firstName || 'there'},\n\nThanks for signing up — you're on the waitlist for the Nairobi Esports Expo. We'll keep you posted on dates and how to get involved.\n\n${siteUrl}`,
  };
}

export function waitlistInternalNotificationEmail({ firstName, lastName, email, phone, source, audienceType, createdAt, siteUrl }) {
  const heading = `New Expo Waitlist Signup — ${escapeHtml(firstName || email)}`;
  const rows = [
    ['Name', [firstName, lastName].filter(Boolean).join(' ') || '—'],
    ['Email', email],
    ['Phone', phone || '—'],
    ['Audience type', audienceType || '—'],
    ['Source', source || '—'],
    ['Timestamp', createdAt],
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#a6a6b8;">${escapeHtml(k)}</td><td style="color:#f5f5fa;">${escapeHtml(v)}</td></tr>`).join('');
  const bodyHtml = `<table role="presentation" style="font-size:14px;">${rows}</table>`;
  return {
    subject: heading,
    html: layout({ preheader: heading, heading, bodyHtml, ctaLabel: 'Open admin', ctaUrl: siteUrl }),
    text: `New waitlist signup: ${email}`,
  };
}

export function partnerConfirmationEmail({ contactName, organisationName, siteUrl }) {
  const name = contactName ? escapeHtml(contactName) : 'there';
  const heading = "We've received your Nairobi Esports Expo partnership enquiry";
  const bodyHtml = `<p>Hi ${name},</p>
<p>Thank you for your interest in partnering with the Nairobi Esports Expo${organisationName ? ` on behalf of <strong>${escapeHtml(organisationName)}</strong>` : ''}.</p>
<p>Our team reviews every partnership enquiry individually to find the best fit across sponsorship, exhibition, technology, skills and community. We'll be in touch shortly with next steps.</p>`;
  return {
    subject: heading,
    html: layout({ preheader: heading, heading, bodyHtml, ctaLabel: 'Visit the site', ctaUrl: siteUrl }),
    text: `Hi ${contactName || 'there'},\n\nThank you for your interest in partnering with the Nairobi Esports Expo. Our team reviews every enquiry individually and will be in touch shortly.\n\n${siteUrl}`,
  };
}

export function partnerInternalNotificationEmail({ organisationName, organisationType, contactName, jobTitle, email, phone, website, interests, timeline, message, leadScore, leadPriority, source, createdAt, siteUrl }) {
  const heading = `🔥 New Partner Lead — ${escapeHtml(organisationName || contactName || email)}`;
  const rows = [
    ['Organisation', organisationName || '—'],
    ['Org type', organisationType || '—'],
    ['Website', website || '—'],
    ['Contact', contactName || '—'],
    ['Job title', jobTitle || '—'],
    ['Email', email],
    ['Phone', phone || '—'],
    ['Interests', Array.isArray(interests) ? interests.join(', ') : '—'],
    ['Timeline', timeline || '—'],
    ['Lead score', `${leadScore ?? 0} (${leadPriority || 'low'})`],
    ['Source', source || '—'],
    ['Timestamp', createdAt],
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#a6a6b8;">${escapeHtml(k)}</td><td style="color:#f5f5fa;">${escapeHtml(v)}</td></tr>`).join('');
  const bodyHtml = `<table role="presentation" style="font-size:14px;">${rows}</table>${message ? `<p style="margin-top:16px;">${escapeHtml(message)}</p>` : ''}`;
  return {
    subject: heading,
    html: layout({ preheader: heading, heading, bodyHtml, ctaLabel: 'Open admin', ctaUrl: siteUrl }),
    text: `New partner lead: ${organisationName || email} (score ${leadScore ?? 0}, ${leadPriority || 'low'})`,
  };
}

export async function sendEmail(env, { to, subject, html, text, replyTo }) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || 'Nairobi Esports Expo <noreply@nairobiesportsexpo.co.ke>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
  return res.json();
}
