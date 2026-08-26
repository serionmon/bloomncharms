import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { validateCouponSchema } from './validation.js';
import { DiscountService } from './service.js';

export const discountRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * POST /api/discounts/validate
   * Authoritative server-side discount validation for checkout.
   * Does NOT leak internal campaign limits, customer records, or future coupons.
   */
  fastify.post('/validate', async (request, reply) => {
    const parseResult = validateCouponSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        valid: false,
        discountAmount: 0,
        message: parseResult.error.errors[0]?.message || 'Invalid coupon request payload.',
      });
    }

    const { code, subtotal } = parseResult.data;
    const userId = (request.user as any)?.id;

    try {
      const result = await DiscountService.validateDiscountCode(code, subtotal, userId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(200).send({
        valid: false,
        discountAmount: 0,
        message: err.message || 'Discount validation service unavailable.',
      });
    }
  });
};
