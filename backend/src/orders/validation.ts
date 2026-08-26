import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID or identifier is required.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  customization: z.record(z.any()).optional().nullable(),
});

export const shippingAddressSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Recipient first name is required.')
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(1, 'Recipient last name is required.')
    .max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(150),
  addressLine1: z
    .string()
    .trim()
    .min(5, 'Street address must be at least 5 characters.')
    .max(255),
  addressLine2: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .min(2, 'City name is required.')
    .max(100),
  state: z
    .string()
    .trim()
    .min(2, 'State name is required.')
    .max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Postal PIN code must be exactly 6 digits.'),
  country: z
    .string()
    .trim()
    .default('IN'),
});

export const orderPreviewSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required in the cart.'),
  couponCode: z.string().trim().optional().nullable(),
  paymentMethod: z.enum(['full_online', 'hybrid', 'cod', 'unknown']).default('full_online'),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required in the cart.'),
  shippingAddress: shippingAddressSchema,
  couponCode: z.string().trim().optional().nullable(),
  paymentMethod: z.enum(['full_online', 'hybrid', 'cod', 'unknown']).default('full_online'),
  notes: z.string().trim().max(500).optional().nullable(),
  idempotencyKey: z.string().trim().max(100).optional().nullable(),
});

export const orderNumberParamSchema = z.object({
  orderNumber: z.string().trim().min(3, 'Invalid order number format.'),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type OrderPreviewInput = z.infer<typeof orderPreviewSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
