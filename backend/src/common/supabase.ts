import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { Database } from './types.js';

let adminClient: SupabaseClient<Database> | null = null;
let anonClient: SupabaseClient<Database> | null = null;

/**
 * Returns a privileged Supabase client with the Service Role key.
 * Used strictly in the backend for authoritative database operations.
 */
export function getAdminSupabaseClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for privileged backend operations.'
    );
  }

  adminClient = createClient<Database>(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

/**
 * Returns a public anonymous Supabase client.
 */
export function getAnonSupabaseClient(): SupabaseClient<Database> {
  if (anonClient) return anonClient;

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY must be configured for public client operations.'
    );
  }

  anonClient = createClient<Database>(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return anonClient;
}

/**
 * Creates a client scoped to a customer's JWT token for RLS verification.
 */
export function createAuthHeaderClient(token: string): SupabaseClient<Database> {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials not configured.');
  }

  return createClient<Database>(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
