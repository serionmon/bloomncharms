import { z } from 'zod';

export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20),
  email: z.string().email('Invalid email address'),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z.string().min(3, 'Postal code is required').max(20),
  country: z.string().default('IN'),
  isDefault: z.boolean().default(false),
});

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  customization: z.record(z.unknown()).optional(),
});

export const orderCreateSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid customer email'),
  customerPhone: z.string().min(8, 'Phone number is required'),
  shippingAddress: addressSchema,
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  notes: z.string().max(1000).optional(),
});

export const productCreateSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  sku: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(100),
  name: z.string().min(1, 'Product name is required').max(255),
  subtitle: z.string().max(255).optional(),
  description: z.string().default(''),
  price: z.number().nonnegative('Price cannot be negative'),
  currency: z.string().default('INR'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  altText: z.string().default(''),
  badge: z.string().max(50).optional(),
  tag: z.string().max(50).optional(),
  isCustomizable: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isActive: z.boolean().default(true),
  processingDays: z.number().int().nonnegative().optional(),
});

export const discountValidateSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
});
