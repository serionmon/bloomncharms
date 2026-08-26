import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { discountValidateSchema } from '../common/validation.js';
import { getAdminSupabaseClient } from '../common/supabase.js';

export const discountRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/discounts/validate — Secure discount code validation
  fastify.post('/validate', async (request, reply) => {
    const parseResult = discountValidateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        valid: false,
        discountAmount: 0,
        message: 'Invalid request payload',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { code, subtotal } = parseResult.data;
    const normalizedCode = code.trim().toUpperCase();

    // Check if Supabase connection is configured
    try {
      const supabase = getAdminSupabaseClient();
      const now = new Date().toISOString();

      const { data: discount, error } = await supabase
        .from('discounts')
        .select('id, code, discount_type, value, minimum_order_amount, maximum_discount_amount, usage_limit, is_active, starts_at, expires_at')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .lte('starts_at', now)
        .maybeSingle();

      if (error || !discount) {
        return reply.status(200).send({
          valid: false,
          discountAmount: 0,
          message: 'Invalid or expired discount code',
        });
      }

      // Check expiration
      if (discount.expires_at && new Date(discount.expires_at) <= new Date()) {
        return reply.status(200).send({
          valid: false,
          discountAmount: 0,
          message: 'This discount code has expired',
        });
      }

      // Check minimum order amount
      if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
        return reply.status(200).send({
          valid: false,
          discountAmount: 0,
          message: `Minimum order amount of ₹${discount.minimum_order_amount} required`,
        });
      }

      // Calculate discount amount server-side
      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = Math.round(((subtotal * discount.value) / 100) * 100) / 100;
        if (discount.maximum_discount_amount && discountAmount > discount.maximum_discount_amount) {
          discountAmount = discount.maximum_discount_amount;
        }
      } else if (discount.discount_type === 'fixed_amount') {
        discountAmount = Math.min(discount.value, subtotal);
      }

      return reply.status(200).send({
        valid: true,
        discountAmount,
        message: 'Discount applied',
      });
    } catch {
      // Fallback if database is not yet connected in dev environment
      return reply.status(200).send({
        valid: false,
        discountAmount: 0,
        message: 'Discount validation service currently unavailable',
      });
    }
  });
};
