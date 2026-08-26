import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const inventoryRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/:productId', async (request, reply) => {
    return reply.status(501).send({
      message: 'Inventory check endpoint foundation prepared.',
    });
  });

  fastify.post('/check', async (request, reply) => {
    return reply.status(501).send({
      message: 'Bulk inventory check endpoint foundation prepared.',
    });
  });
};
