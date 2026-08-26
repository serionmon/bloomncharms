import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js middleware — runs on every matched request.
 * Responsibilities:
 *   1. Refresh the Supabase session cookie (keeps auth alive).
 *   2. Redirect unauthenticated users from /account to /account/sign-in.
 *   3. Redirect authenticated users away from /account/sign-in and /account/create.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/* (API routes — not Next.js routes)
     * - public folder assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|brand/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
