import { supabase } from "@/integrations/supabase/client";

interface AdminCallOptions {
  action: string;
  params?: Record<string, string>;
  method?: string;
  body?: Record<string, unknown>;
  clerkUserId: string;
}

export async function adminCall<T = unknown>({ action, params = {}, method = "GET", body, clerkUserId }: AdminCallOptions): Promise<T> {
  const queryParams = new URLSearchParams({ action, ...params });
  
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/clerk-admin?${queryParams}`;
  
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'x-clerk-user-id': clerkUserId,
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  
  return res.json();
}
