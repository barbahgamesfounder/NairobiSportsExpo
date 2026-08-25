// GET /admin/leads — returns contacts joined with their partner_interests.
// Protected by functions/admin/_middleware.js (Basic Auth); read-only.
import { listContacts, listPartnerInterests } from '../_lib/supabase.js';

export async function onRequestGet({ env }) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Database is not configured yet' }), { status: 503 });
  }

  try {
    const [contacts, interests] = await Promise.all([
      listContacts(env),
      listPartnerInterests(env),
    ]);

    const interestsByContact = new Map();
    for (const row of interests) {
      const list = interestsByContact.get(row.contact_id) || [];
      list.push(row);
      interestsByContact.set(row.contact_id, list);
    }

    const leads = contacts.map((c) => ({
      ...c,
      partner_interests: interestsByContact.get(c.id) || [],
    }));

    return new Response(JSON.stringify({ leads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin leads fetch failed', err);
    return new Response(JSON.stringify({ error: 'Failed to load leads' }), { status: 502 });
  }
}
