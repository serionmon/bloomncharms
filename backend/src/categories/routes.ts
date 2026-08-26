import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ProductService } from '../products/service.js';

export const categoryRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/categories
  fastify.get('/', async (_request, reply) => {
    const categories = await ProductService.getCategories();
    return reply.status(200).send({
      categories,
    });
  });
};