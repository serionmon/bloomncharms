import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: 'customer' | 'admin';
    };
    rawBody?: Buffer;
  }
}
