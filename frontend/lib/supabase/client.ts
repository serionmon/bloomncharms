import { createBrowserClient } from '@supabase/ssr';
import { type Database } from './types';

/**
 * Browser-side Supabase client.
 * Uses @supabase/ssr createBrowserClient for cookie-based session handling
 * compatible with Next.js 15 App Router.
 *
 * Safe to call in Client Components ('use client').
 * Do NOT import in Server Components or API routes — use server.ts instead.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient<Database>(url, anonKey);
}

