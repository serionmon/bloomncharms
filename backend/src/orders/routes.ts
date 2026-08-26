import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../auth/plugin.js';
import { CustomerService } from '../customers/service.js';
import { OrderService } from './service.js';
import {
  orderPreviewSchema,
  createOrderSchema,
  orderNumberParamSchema,
} from './validation.js';
import { getAnonSupabaseClient } from '../common/supabase.js';

export const orderRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * Helper to extract optional authenticated user ID from Authorization header without rejecting guests.
   */
  const extractOptionalUserId = async (request: any): Promise<string | undefined> => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return undefined;

    try {
      const anonClient = getAnonSupabaseClient();
      const { data, error } = await anonClient.auth.getUser(token);
      if (!error && data?.user?.id) {
        return data.user.id;
      }
    } catch {
      // Gracefully fall back to guest if token is invalid or offline
    }
    return undefined;
  };

  /**
   * POST /api/orders/preview
   * Authoritative calculation of items, current catalog prices, stock availability, and promotional discounts.
   */
  fastify.post('/preview', async (request, reply) => {
    const bodyResult = orderPreviewSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid order preview payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const userId = await extractOptionalUserId(request);
      const preview = await OrderService.previewOrder(bodyResult.data, userId);
      return reply.status(200).send({ preview });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.name || 'Bad Request',
        message: err.message || 'Failed to calculate order preview.',
      });
    }
  });

  /**
   * POST /api/orders
   * Authoritative order placement, stock deduction, and discount recording.
   */
  fastify.post('/', async (request, reply) => {
    const bodyResult = createOrderSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid order creation payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const userId = await extractOptionalUserId(request);
      const order = await OrderService.createOrder(bodyResult.data, userId);
      return reply.status(201).send({
        order,
        message: 'Order created successfully.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.name || 'Bad Request',
        message: err.message || 'Failed to create order.',
      });
    }
  });

  /**
   * GET /api/orders/my-orders
   * Authenticated customer order history.
   */
  fastify.get('/my-orders', { preHandler: authenticate }, async (request: any, reply) => {
    try {
      const orders = await CustomerService.listOrders(request.user.id);
      return reply.status(200).send({
        orders,
        total: orders.length,
      });
    } catch (err: any) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to retrieve order history.',
      });
    }
  });

  /**
   * GET /api/orders/:orderNumber
   * Public tracking lookup.
   */
  fastify.get('/:orderNumber', async (request, reply) => {
    const paramResult = orderNumberParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid order number format.',
      });
    }

    try {
      const tracking = await OrderService.getOrderByOrderNumber(paramResult.data.orderNumber);
      return reply.status(200).send({ tracking });
    } catch (err: any) {
      return reply.status(err.statusCode || 404).send({
        statusCode: err.statusCode || 404,
        error: 'Not Found',
        message: err.message || 'Order not found.',
      });
    }
  });
};
