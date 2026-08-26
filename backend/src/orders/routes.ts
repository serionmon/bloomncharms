import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const orderRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/', async (request, reply) => {
    return reply.status(501).send({
      message: 'Order creation endpoint foundation prepared.',
    });
  });

  fastify.get('/:orderNumber', async (request, reply) => {
    return reply.status(501).send({
      message: 'Order tracking lookup endpoint foundation prepared.',
    });
  });

  fastify.get('/my-orders', async (request, reply) => {
    return reply.status(501).send({
      message: 'Customer order history endpoint foundation prepared.',
    });
  });
};
