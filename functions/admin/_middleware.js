// Gates every request under /admin (static page + API) behind HTTP Basic Auth.
// Credentials live only as Cloudflare secrets — never in source or the client.
function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Nairobi Esports Expo Admin"' },
  });
}

export async function onRequest({ request, env, next }) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return new Response('Admin area is not configured yet', { status: 503 });
  }

  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return unauthorized();

  let decoded;
  try {
    decoded = atob(auth.slice(6));
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(':');
  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (user !== env.ADMIN_USERNAME || pass !== env.ADMIN_PASSWORD) {
    return unauthorized();
  }

  return next();
}
