/**
 * Fastify type augmentation — adds request.user to every request.
 * Import this file once in server.ts or app.ts to enable the decoration.
 */
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Authenticated user payload, set by the `authenticate` preHandler.
     * Undefined on unauthenticated routes.
     */
    user?: {
      id: string;
      email: string;
      role: 'customer' | 'admin';
    };
  }
}

export {};
