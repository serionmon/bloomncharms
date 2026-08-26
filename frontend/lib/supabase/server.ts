import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type Database } from './types';

/**
 * Server-side Supabase client for Server Components, Route Handlers, and Server Actions.
 * Uses @supabase/ssr createServerClient with Next.js cookies() for session persistence.
 *
 * Must be called inside async Server Components or Route Handlers.
 * Do NOT import in Client Components ('use client') — use client.ts instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — cookies cannot be set.
            // This is expected; the middleware handles session refresh.
          }
        },
      },
    }
  );
}
