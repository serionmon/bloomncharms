import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { type Database } from './types';

/**
 * Refreshes the Supabase session inside Next.js middleware.
 * Must be called at the top of middleware.ts before any redirect logic
 * so that the session cookie is kept alive on every request.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this; it keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public auth routes that must ALWAYS be accessible (unauthenticated).
  const publicAuthRoutes = [
    '/account/sign-in',
    '/account/create',
    '/account/forgot-password',
    '/account/reset-password',
  ];

  const isPublicAuthRoute = publicAuthRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Protect /account — redirect unauthenticated users to sign-in.
  if (!user && pathname.startsWith('/account') && !isPublicAuthRoute) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/account/sign-in';
    return NextResponse.redirect(signInUrl);
  }

  // If the user is signed in and hits the sign-in/create pages, redirect to account.
  if (user && (pathname === '/account/sign-in' || pathname === '/account/create')) {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = '/account';
    return NextResponse.redirect(accountUrl);
  }

  return supabaseResponse;
}
