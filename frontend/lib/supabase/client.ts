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
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
