import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const shippingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/calculate', async (request, reply) => {
    return reply.status(501).send({
      message: 'Shipping calculation foundation prepared (Courier integration deferred).',
    });
  });

  fastify.get('/track/:trackingNumber', async (request, reply) => {
    return reply.status(501).send({
      message: 'Shipping tracking foundation prepared (Courier integration deferred).',
    });
  });
};
