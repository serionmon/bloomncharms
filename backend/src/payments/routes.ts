import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticateOptional } from '../auth/plugin.js';
import { RazorpayService } from './service.js';
import { createRazorpayOrderSchema, verifyPaymentSchema } from './validation.js';

export const paymentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * POST /api/payments/razorpay/order
   * Creates a server-authoritative Razorpay payment order.
   */
  fastify.post(
    '/razorpay/order',
    { preHandler: [authenticateOptional] },
    async (request, reply) => {
      const parsed = createRazorpayOrderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parsed.error.issues[0]?.message || 'Invalid order creation payload',
        });
      }

      const userId = request.user?.id;
      const razorpayOrder = await RazorpayService.createPaymentOrder(parsed.data, userId);

      return reply.status(200).send({
        success: true,
        razorpayOrder,
      });
    }
  );

  /**
   * POST /api/payments/razorpay/verify
   * Verifies Razorpay HMAC-SHA256 signature and transitions local order payment state.
   */
  fastify.post(
    '/razorpay/verify',
    { preHandler: [authenticateOptional] },
    async (request, reply) => {
      const parsed = verifyPaymentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: parsed.error.issues[0]?.message || 'Invalid payment verification payload',
        });
      }

      const userId = request.user?.id;
      const result = await RazorpayService.verifyPaymentSignature(parsed.data, userId);

      return reply.status(200).send({
        success: true,
        result,
      });
    }
  );

  /**
   * POST /api/payments/razorpay/webhook
   * Razorpay Webhook Endpoint for payment capture / failure event notifications.
   */
  fastify.post('/razorpay/webhook', async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Missing X-Razorpay-Signature header',
      });
    }

    const rawBody: Buffer =
      (request as any).rawBody ||
      Buffer.from(typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {}));

    const result = await RazorpayService.handleWebhook(rawBody, signature);

    return reply.status(200).send({
      status: 'ok',
      ...result,
    });
  });
};
