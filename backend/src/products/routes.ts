import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const productRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/', async (request, reply) => {
    return reply.status(200).send({
      products: [],
      total: 0,
      message: 'Product catalog endpoint foundation prepared.',
    });
  });

  fastify.get('/:slug', async (request, reply) => {
    return reply.status(501).send({
      message: 'Product detail endpoint foundation prepared.',
    });
  });

  fastify.get('/categories', async (request, reply) => {
    return reply.status(200).send({
      categories: ['bouquets', 'flowers', 'keyrings', 'charms', 'gift-sets'],
    });
  });
};
