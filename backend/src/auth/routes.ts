import { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import { authenticate } from './plugin.js';
import '../types/fastify.js';

/**
 * /api/auth routes
 *
 * Auth (sign-up, sign-in, sign-out) is handled client-side via Supabase SDK.
 * The backend's responsibility is:
 *   1. Verify JWTs from the Authorization header.
 *   2. Return the authenticated user's identity + role.
 *
 * Never perform sign-up or password hashing here — that is Supabase Auth's job.
 */
export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/auth/me
   *
   * Unauthenticated → 401
   * Authenticated   → { user: { id, email, role } }
   */
  fastify.get(
    '/me',
    { preHandler: authenticate },
    async (request, reply) => {
      // request.user is guaranteed to be set by the authenticate preHandler.
      return reply.status(200).send({
        user: request.user,
      });
    }
  );
};
