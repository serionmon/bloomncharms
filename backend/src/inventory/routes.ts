import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { InventoryService } from './service.js';
import { checkInventorySchema } from './validation.js';
import { productIdParamSchema } from '../storage/validation.js';

export const inventoryRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/inventory/:productId
   * Public stock availability check (returns derived status: In Stock, Low Stock, Out of Stock).
   * Does NOT leak internal warehouse counts to public clients.
   */
  fastify.get('/:productId', async (request, reply) => {
    const paramResult = productIdParamSchema.safeParse({ id: (request.params as any).productId });
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid product ID format.',
      });
    }

    try {
      const stockInfo = await InventoryService.getPublicStock(paramResult.data.id);
      return reply.status(200).send(stockInfo);
    } catch (err: any) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to check inventory.',
      });
    }
  });

  /**
   * POST /api/inventory/check
   * Bulk cart availability check before checkout.
   */
  fastify.post('/check', async (request, reply) => {
    const bodyResult = checkInventorySchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid check payload.',
      });
    }

    try {
      const result = await InventoryService.checkCartAvailability(bodyResult.data.items);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to check cart availability.',
      });
    }
  });
};
