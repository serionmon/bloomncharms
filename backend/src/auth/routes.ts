import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/register', async (request, reply) => {
    return reply.status(501).send({
      statusCode: 510,
      message: 'Auth registration endpoint foundation prepared.',
    });
  });

  fastify.post('/login', async (request, reply) => {
    return reply.status(501).send({
      statusCode: 510,
      message: 'Auth login endpoint foundation prepared.',
    });
  });

  fastify.post('/logout', async (request, reply) => {
    return reply.status(501).send({
      statusCode: 510,
      message: 'Auth logout endpoint foundation prepared.',
    });
  });

  fastify.get('/me', async (request, reply) => {
    return reply.status(501).send({
      statusCode: 510,
      message: 'Auth user profile endpoint foundation prepared.',
    });
  });
};
