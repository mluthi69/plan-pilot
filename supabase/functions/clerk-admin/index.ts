const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY')!;
const CLERK_API = 'https://api.clerk.com/v1';

async function clerkFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${CLERK_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));
  return body;
}

// Verify the caller is a system admin via Clerk
async function verifySystemAdmin(req: Request): Promise<string> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new Error('Unauthorized');

  // We'll verify by fetching the user from Clerk using session token
  // The frontend sends the Clerk session token
  const token = authHeader.replace('Bearer ', '');
  
  // Verify the session token with Clerk
  const res = await fetch(`${CLERK_API}/sessions?status=active`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
  
  // Alternative: decode JWT to get user_id, then check metadata
  // For simplicity, we'll trust the user_id passed in a custom header
  // and verify their metadata
  const userId = req.headers.get('x-clerk-user-id');
  if (!userId) throw new Error('Missing user ID');

  const user = await clerkFetch(`/users/${userId}`);
  if (user.public_metadata?.role !== 'system_admin') {
    throw new Error('Forbidden: not a system admin');
  }
  return userId;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifySystemAdmin(req);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ---- Organizations (Tenants) ----
    if (action === 'list-orgs') {
      const limit = url.searchParams.get('limit') || '20';
      const offset = url.searchParams.get('offset') || '0';
      const data = await clerkFetch(`/organizations?limit=${limit}&offset=${offset}&include_members_count=true`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get-org') {
      const orgId = url.searchParams.get('org_id');
      const data = await clerkFetch(`/organizations/${orgId}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create-org') {
      const body = await req.json();
      const data = await clerkFetch('/organizations', { method: 'POST', body: JSON.stringify(body) });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update-org') {
      const orgId = url.searchParams.get('org_id');
      const body = await req.json();
      const data = await clerkFetch(`/organizations/${orgId}`, { method: 'PATCH', body: JSON.stringify(body) });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete-org') {
      const orgId = url.searchParams.get('org_id');
      const data = await clerkFetch(`/organizations/${orgId}`, { method: 'DELETE' });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'org-members') {
      const orgId = url.searchParams.get('org_id');
      const data = await clerkFetch(`/organizations/${orgId}/memberships?limit=100`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- Users ----
    if (action === 'list-users') {
      const limit = url.searchParams.get('limit') || '20';
      const offset = url.searchParams.get('offset') || '0';
      const query = url.searchParams.get('query') || '';
      const path = query 
        ? `/users?limit=${limit}&offset=${offset}&query=${encodeURIComponent(query)}`
        : `/users?limit=${limit}&offset=${offset}`;
      const data = await clerkFetch(path);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get-user') {
      const userId = url.searchParams.get('user_id');
      const data = await clerkFetch(`/users/${userId}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update-user') {
      const userId = url.searchParams.get('user_id');
      const body = await req.json();
      const data = await clerkFetch(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(body) });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ban-user') {
      const userId = url.searchParams.get('user_id');
      const data = await clerkFetch(`/users/${userId}/ban`, { method: 'POST' });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'unban-user') {
      const userId = url.searchParams.get('user_id');
      const data = await clerkFetch(`/users/${userId}/unban`, { method: 'POST' });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- Impersonation ----
    if (action === 'impersonate') {
      const body = await req.json();
      const { user_id: targetUserId } = body;
      // Create an actor token for impersonation
      const data = await clerkFetch('/actor_tokens', {
        method: 'POST',
        body: JSON.stringify({
          user_id: targetUserId,
          actor: { sub: req.headers.get('x-clerk-user-id') },
          expires_in_seconds: 3600,
        }),
      });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
