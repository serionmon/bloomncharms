import { z } from 'zod';

export const updateInventorySchema = z.object({
  stockQuantity: z
    .coerce
    .number({ invalid_type_error: 'Stock quantity must be a number.' })
    .int('Stock quantity must be an integer.')
    .min(0, 'Stock quantity cannot be negative.')
    .optional(),
  lowStockThreshold: z
    .coerce
    .number({ invalid_type_error: 'Low stock threshold must be a number.' })
    .int('Low stock threshold must be an integer.')
    .min(0, 'Low stock threshold cannot be negative.')
    .optional(),
}).refine(
  (data) => data.stockQuantity !== undefined || data.lowStockThreshold !== undefined,
  {
    message: 'At least one of stockQuantity or lowStockThreshold must be provided.',
  }
);

export const checkInventorySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID format.'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
      })
    )
    .min(1, 'At least one item must be checked.'),
});

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type CheckInventoryInput = z.infer<typeof checkInventorySchema>;

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/**
 * Derives authoritative stock status based on stock quantity and threshold.
 */
export function deriveStockStatus(stockQuantity: number, lowStockThreshold: number): StockStatus {
  if (stockQuantity <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (stockQuantity <= lowStockThreshold) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

/**
 * Returns human-readable public stock label.
 */
export function getPublicStockLabel(status: StockStatus): string {
  switch (status) {
    case 'OUT_OF_STOCK':
      return 'Out of Stock';
    case 'LOW_STOCK':
      return 'Low Stock';
    case 'IN_STOCK':
      return 'In Stock';
  }
}
