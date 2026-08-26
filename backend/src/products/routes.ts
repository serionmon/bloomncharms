import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ProductService, ProductQueryFilters } from './service.js';

export const productRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/products/categories (Convenience alias)
  fastify.get('/categories', async (_request, reply) => {
    const categories = await ProductService.getCategories();
    return reply.status(200).send({
      categories,
    });
  });

  // GET /api/products
  fastify.get('/', async (request, reply) => {
    const query = request.query as {
      category?: string;
      featured?: string;
      customizable?: string;
      search?: string;
      sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest';
    };

    const filters: ProductQueryFilters = {
      category: query.category,
      featured: query.featured === 'true',
      customizable: query.customizable === 'true',
      search: query.search,
      sort: query.sort,
    };

    const result = await ProductService.getProducts(filters);
    return reply.status(200).send(result);
  });

  // GET /api/products/:slug
  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    if (!slug) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Product slug is required.',
      });
    }

    const product = await ProductService.getProductBySlug(slug);

    if (!product) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Product with slug '${slug}' not found.`,
      });
    }

    return reply.status(200).send({
      product,
    });
  });
};