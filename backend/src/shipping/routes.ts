import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ShippingService } from './service.js';

const createShipmentSchema = z.object({
  pickupLocation: z.string().optional(),
  lengthCm: z.number().min(1).optional(),
  breadthCm: z.number().min(1).optional(),
  heightCm: z.number().min(1).optional(),
  weightKg: z.number().min(0.01).optional(),
});

const assignAwbSchema = z.object({
  courierId: z.number().optional(),
});

export const shippingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ---------------------------------------------------------------------------
  // PUBLIC / CUSTOMER TRACKING ROUTE (GET /api/shipping/track/:orderIdentifier)
  // ---------------------------------------------------------------------------

  fastify.get(
    '/track/:orderIdentifier',
    async (request, reply) => {
      const { orderIdentifier } = request.params as { orderIdentifier: string };
      const userId = (request.user as any)?.id;
      const isAdmin = (request.user as any)?.role === 'admin';

      try {
        const tracking = await ShippingService.getShipmentTracking(orderIdentifier, userId, isAdmin);
        return reply.send(tracking);
      } catch (err: any) {
        return reply.status(err.statusCode || 400).send({
          statusCode: err.statusCode || 400,
          error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
          message: err.message || 'Unable to retrieve tracking details.',
        });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // WEBHOOK ENDPOINT (POST /api/shipping/webhook)
  // ---------------------------------------------------------------------------

  fastify.post(
    '/webhook',
    async (request, reply) => {
      const signatureHeader =
        (request.headers['x-shiprocket-token'] as string) ||
        (request.headers['x-shiprocket-signature'] as string) ||
        (request.headers['authorization'] as string);

      try {
        const result = await ShippingService.handleWebhook(request.body, signatureHeader);
        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(err.statusCode || 400).send({
          statusCode: err.statusCode || 400,
          error: err.name || 'Bad Request',
          message: err.message || 'Webhook processing failed.',
        });
      }
    }
  );
};
