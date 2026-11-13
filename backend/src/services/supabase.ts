import '../config/env.js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function isPlaceholderKey(val?: string): boolean {
  if (!val) return true;
  const k = val.trim().toLowerCase();
  return (
    k === '' ||
    k.startsWith('your-') ||
    k.includes('placeholder') ||
    k.includes('example') ||
    k === 'placeholder-key'
  );
}

const rawUrl = (process.env.SUPABASE_URL || '').trim();
const rawServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawAnon =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

// Select valid key with preference for a genuine service-role key, falling back to anon key.
// Never select a placeholder string.
let activeKey = '';
let activeKeyRole: 'service_role' | 'anon' | 'none' = 'none';

if (rawServiceRole && !isPlaceholderKey(rawServiceRole)) {
  activeKey = rawServiceRole.trim();
  activeKeyRole = 'service_role';
} else if (rawAnon && !isPlaceholderKey(rawAnon)) {
  activeKey = rawAnon.trim();
  activeKeyRole = 'anon';
}

if (!rawUrl || !activeKey) {
  console.warn(
    '⚠️ Warning: SUPABASE_URL and a valid SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be defined in backend environment.'
  );
}

export const supabaseServer: SupabaseClient = createClient(
  rawUrl || 'https://placeholder.supabase.co',
  activeKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Creates a Supabase client scoped to the authenticated user's access token.
 * This ensures PostgREST operations strictly enforce Row Level Security (RLS)
 * under the authenticated user's identity (auth.uid() = user.id).
 */
export function getScopedSupabaseClient(userToken?: string): SupabaseClient {
  const headers: Record<string, string> = {};
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  return createClient(
    rawUrl || 'https://placeholder.supabase.co',
    activeKey || 'placeholder-key',
    {
      global: {
        headers,
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
