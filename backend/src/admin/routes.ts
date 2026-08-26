import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/products', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin products list foundation prepared.',
    });
  });

  fastify.post('/products', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin product creation foundation prepared.',
    });
  });

  fastify.put('/products/:id', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin product update foundation prepared.',
    });
  });

  fastify.delete('/products/:id', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin product deletion foundation prepared.',
    });
  });

  fastify.get('/orders', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin orders list foundation prepared.',
    });
  });

  fastify.put('/orders/:id/status', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin order status update foundation prepared.',
    });
  });

  fastify.get('/inventory', async (request, reply) => {
    return reply.status(501).send({
      message: 'Admin inventory management foundation prepared.',
    });
  });
};
