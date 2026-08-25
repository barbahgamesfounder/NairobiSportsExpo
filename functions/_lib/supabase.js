// Shared Supabase REST helpers for Cloudflare Pages Functions.
// Server-side only — env.SUPABASE_SERVICE_ROLE_KEY must never reach the client.
const SUPABASE_URL = 'https://zunzpicmtwgmnvyberdg.supabase.co';

async function supabaseFetch(env, path, options = {}) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase request failed (${res.status}): ${body}`);
  }
  return res;
}

// Upserts a contact by email via the upsert_contact() Postgres function.
// This preserves lifecycle_status/created_at on repeat submissions and
// adds to lead_score rather than overwriting it — see the migration for why.
export async function upsertContact(env, contact, leadScoreDelta = 0) {
  const res = await supabaseFetch(env, '/rest/v1/rpc/upsert_contact', {
    method: 'POST',
    body: JSON.stringify({
      p_first_name: contact.firstName || null,
      p_last_name: contact.lastName || null,
      p_email: contact.email,
      p_phone: contact.phone || null,
      p_organisation_name: contact.organisationName || null,
      p_organisation_type: contact.organisationType || null,
      p_job_title: contact.jobTitle || null,
      p_signup_type: contact.signupType,
      p_marketing_consent: !!contact.marketingConsent,
      p_source: contact.source || null,
      p_utm_source: contact.utmSource || null,
      p_utm_medium: contact.utmMedium || null,
      p_utm_campaign: contact.utmCampaign || null,
      p_utm_content: contact.utmContent || null,
      p_referrer: contact.referrer || null,
      p_lead_score_delta: leadScoreDelta,
    }),
  });
  return res.json();
}

export async function insertPartnerInterest(env, row) {
  const res = await supabaseFetch(env, '/rest/v1/partner_interests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  const rows = await res.json();
  return rows[0];
}

export async function listContacts(env, { limit = 200 } = {}) {
  const res = await supabaseFetch(env, `/rest/v1/contacts?select=*&order=created_at.desc&limit=${limit}`);
  return res.json();
}

export async function listPartnerInterests(env, { limit = 200 } = {}) {
  const res = await supabaseFetch(env, `/rest/v1/partner_interests?select=*&order=created_at.desc&limit=${limit}`);
  return res.json();
}
