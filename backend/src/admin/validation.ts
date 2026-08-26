import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required.').max(150),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. signature-bouquet).')
    .optional(),
  sku: z.string().max(50).optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID.').optional().nullable(),
  subtitle: z.string().max(200).optional(),
  description: z.string().optional().default(''),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0.'),
  currency: z.string().max(10).optional().default('INR'),
  imageUrl: z.string().optional().nullable(),
  altText: z.string().max(255).optional().default(''),
  badge: z.string().max(50).optional().nullable(),
  tag: z.string().max(50).optional().nullable(),
  isCustomizable: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isBestseller: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  processingDays: z.coerce.number().int().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0, 'Stock quantity must be >= 0.').optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0, 'Low stock threshold must be >= 0.').optional().default(3),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty.').max(150).optional(),
  slug: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens.')
    .optional(),
  sku: z.string().max(50).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  subtitle: z.string().max(200).optional().nullable(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be >= 0.').optional(),
  currency: z.string().max(10).optional(),
  imageUrl: z.string().optional().nullable(),
  altText: z.string().max(255).optional(),
  badge: z.string().max(50).optional().nullable(),
  tag: z.string().max(50).optional().nullable(),
  isCustomizable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isActive: z.boolean().optional(),
  processingDays: z.coerce.number().int().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0, 'Stock quantity must be >= 0.').optional(),
  lowStockThreshold: z.coerce.number().int().min(0, 'Low stock threshold must be >= 0.').optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Generates a clean URL slug from a product name.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
