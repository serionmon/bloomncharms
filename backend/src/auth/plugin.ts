import { type FastifyRequest, type FastifyReply } from 'fastify';
import { getAdminSupabaseClient } from '../common/supabase.js';

/**
 * Fastify preHandler — verifies the Supabase JWT from the Authorization header.
 *
 * Usage:
 *   fastify.get('/protected', { preHandler: authenticate }, handler)
 *
 * On success: sets request.user = { id, email, role }
 * On failure: replies 401 Unauthorized
 *
 * NEVER trusts client-supplied user IDs.
 * The identity comes exclusively from the verified Supabase JWT.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.slice(7);

  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired session token.',
    });
  }

  // Fetch the role from public.profiles (authoritative source).
  // The admin client bypasses RLS for this internal lookup.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  request.user = {
    id: data.user.id,
    email: data.user.email ?? '',
    role: (profile?.role as 'customer' | 'admin') ?? 'customer',
  };
}
