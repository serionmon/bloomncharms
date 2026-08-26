import { z } from 'zod';

export const createDiscountSchema = z
  .object({
    code: z
      .string()
      .min(2, 'Coupon code must be at least 2 characters.')
      .max(30, 'Coupon code cannot exceed 30 characters.')
      .regex(/^[A-Za-z0-9_-]+$/, 'Coupon code can only contain alphanumeric characters, hyphens, and underscores.'),
    name: z.string().min(1, 'Discount campaign name is required.').max(100),
    description: z.string().max(300).optional(),
    discountType: z.enum(['percentage', 'fixed_amount'], {
      errorMap: () => ({ message: "Discount type must be either 'percentage' or 'fixed_amount'." }),
    }),
    value: z.coerce.number().positive('Discount value must be greater than 0.'),
    minimumOrderAmount: z.coerce.number().min(0, 'Minimum order amount cannot be negative.').optional().nullable(),
    maximumDiscountAmount: z.coerce.number().min(0, 'Maximum discount cap cannot be negative.').optional().nullable(),
    usageLimit: z.coerce.number().int().positive('Usage limit must be a positive integer.').optional().nullable(),
    perCustomerLimit: z.coerce.number().int().positive('Per-customer limit must be a positive integer.').optional().nullable(),
    startsAt: z.string().datetime({ message: 'startsAt must be a valid ISO datetime string.' }).optional(),
    expiresAt: z.string().datetime({ message: 'expiresAt must be a valid ISO datetime string.' }).optional().nullable(),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'percentage' && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage discount cannot exceed 100%.',
        path: ['value'],
      });
    }

    if (data.startsAt && data.expiresAt) {
      const starts = new Date(data.startsAt);
      const expires = new Date(data.expiresAt);
      if (expires <= starts) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiration date must be later than start date.',
          path: ['expiresAt'],
        });
      }
    }
  });

export const updateDiscountSchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(300).optional().nullable(),
    discountType: z.enum(['percentage', 'fixed_amount']).optional(),
    value: z.coerce.number().positive('Discount value must be greater than 0.').optional(),
    minimumOrderAmount: z.coerce.number().min(0).optional().nullable(),
    maximumDiscountAmount: z.coerce.number().min(0).optional().nullable(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    perCustomerLimit: z.coerce.number().int().positive().optional().nullable(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'percentage' && data.value !== undefined && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage discount cannot exceed 100%.',
        path: ['value'],
      });
    }

    if (data.startsAt && data.expiresAt) {
      const starts = new Date(data.startsAt);
      const expires = new Date(data.expiresAt);
      if (expires <= starts) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiration date must be later than start date.',
          path: ['expiresAt'],
        });
      }
    }
  });

export const discountParamSchema = z.object({
  id: z.string().uuid('Discount ID must be a valid UUID.'),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required.').max(50),
  subtotal: z.coerce.number().min(0, 'Subtotal must be >= 0.'),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
