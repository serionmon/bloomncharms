import { getAdminSupabaseClient, getAnonSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';
import {
  deriveStockStatus,
  getPublicStockLabel,
  StockStatus,
  type UpdateInventoryInput,
} from './validation.js';

export interface InventoryItemDTO {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  slug: string;
  price: number;
  isActive: boolean;
  isCustomizable: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  status: StockStatus;
  publicLabel: string;
  updatedAt: string;
}

export interface PublicStockDTO {
  productId: string;
  inStock: boolean;
  status: StockStatus;
  label: string;
}

export class InventoryService {
  /**
   * Lists inventory for all products with derived stock statuses.
   * Admin-only operation.
   */
  public static async listInventory(filters?: {
    status?: string;
    search?: string;
  }): Promise<InventoryItemDTO[]> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return [];
    }

    const client = config.SUPABASE_SERVICE_ROLE_KEY
      ? getAdminSupabaseClient()
      : getAnonSupabaseClient();

    const { data, error } = await client
      .from('inventory')
      .select(`
        id,
        product_id,
        stock_quantity,
        low_stock_threshold,
        updated_at,
        products (
          id,
          name,
          sku,
          slug,
          price,
          is_active,
          is_customizable
        )
      `)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      throw new Error(`Failed to list inventory: ${error?.message || 'Database error'}`);
    }

    let items: InventoryItemDTO[] = (data as any[]).map((row) => {
      const product = row.products;
      const stock = row.stock_quantity ?? 0;
      const threshold = row.low_stock_threshold ?? 3;
      const status = deriveStockStatus(stock, threshold);

      return {
        id: row.id,
        productId: row.product_id,
        productName: product?.name || 'Unknown Product',
        sku: product?.sku || undefined,
        slug: product?.slug || '',
        price: Number(product?.price ?? 0),
        isActive: Boolean(product?.is_active),
        isCustomizable: Boolean(product?.is_customizable),
        stockQuantity: stock,
        lowStockThreshold: threshold,
        status,
        publicLabel: getPublicStockLabel(status),
        updatedAt: row.updated_at,
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)) ||
          i.slug.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'all') {
      const normalizedStatus = filters.status.toUpperCase();
      items = items.filter((i) => i.status === normalizedStatus);
    }

    return items;
  }

  /**
   * Retrieves inventory details for a specific product ID.
   */
  public static async getProductInventory(productId: string): Promise<InventoryItemDTO | null> {
    const client = getAdminSupabaseClient();

    const { data, error } = await client
      .from('inventory')
      .select(`
        id,
        product_id,
        stock_quantity,
        low_stock_threshold,
        updated_at,
        products (
          id,
          name,
          sku,
          slug,
          price,
          is_active,
          is_customizable
        )
      `)
      .eq('product_id', productId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as any;
    const product = row.products;
    const stock = row.stock_quantity ?? 0;
    const threshold = row.low_stock_threshold ?? 3;
    const status = deriveStockStatus(stock, threshold);

    return {
      id: row.id,
      productId: row.product_id,
      productName: product?.name || 'Unknown Product',
      sku: product?.sku || undefined,
      slug: product?.slug || '',
      price: Number(product?.price ?? 0),
      isActive: Boolean(product?.is_active),
      isCustomizable: Boolean(product?.is_customizable),
      stockQuantity: stock,
      lowStockThreshold: threshold,
      status,
      publicLabel: getPublicStockLabel(status),
      updatedAt: row.updated_at,
    };
  }

  /**
   * Updates or upserts stock quantity and/or threshold for a product.
   */
  public static async updateProductInventory(
    productId: string,
    input: UpdateInventoryInput
  ): Promise<InventoryItemDTO> {
    const client = getAdminSupabaseClient();

    // Verify product exists
    const { data: product, error: findError } = await client
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle();

    if (findError || !product) {
      const error: any = new Error(`Product with ID '${productId}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updatePayload: Record<string, unknown> = {
      product_id: productId,
    };

    if (input.stockQuantity !== undefined) {
      updatePayload.stock_quantity = input.stockQuantity;
    }
    if (input.lowStockThreshold !== undefined) {
      updatePayload.low_stock_threshold = input.lowStockThreshold;
    }

    const { error: upsertError } = await client
      .from('inventory')
      .upsert(updatePayload as any, { onConflict: 'product_id' });

    if (upsertError) {
      throw new Error(`Failed to update inventory: ${upsertError.message}`);
    }

    const updated = await this.getProductInventory(productId);
    if (!updated) {
      throw new Error('Inventory updated but failed to retrieve record.');
    }

    return updated;
  }

  /**
   * Public-safe stock check for a single product without exposing operational numbers.
   */
  public static async getPublicStock(productId: string): Promise<PublicStockDTO> {
    const client = getAdminSupabaseClient();

    const { data } = await client
      .from('inventory')
      .select('stock_quantity, low_stock_threshold')
      .eq('product_id', productId)
      .maybeSingle();

    const stock = data?.stock_quantity ?? 0;
    const threshold = data?.low_stock_threshold ?? 3;
    const status = deriveStockStatus(stock, threshold);

    return {
      productId,
      inStock: stock > 0,
      status,
      label: getPublicStockLabel(status),
    };
  }

  /**
   * Public-safe stock check for multiple items (e.g. cart/checkout validation).
   */
  public static async checkCartAvailability(
    items: { productId: string; quantity: number }[]
  ): Promise<{
    available: boolean;
    items: Array<{
      productId: string;
      requestedQuantity: number;
      available: boolean;
      status: StockStatus;
      message?: string;
    }>;
  }> {
    const client = getAdminSupabaseClient();
    const productIds = items.map((i) => i.productId);

    const { data: invRecords } = await client
      .from('inventory')
      .select('product_id, stock_quantity, low_stock_threshold')
      .in('product_id', productIds);

    const invMap = new Map<string, { stock: number; threshold: number }>();
    (invRecords || []).forEach((row: any) => {
      invMap.set(row.product_id, {
        stock: row.stock_quantity ?? 0,
        threshold: row.low_stock_threshold ?? 3,
      });
    });

    let overallAvailable = true;
    const itemResults = items.map((item) => {
      const inv = invMap.get(item.productId);
      const stock = inv?.stock ?? 0;
      const threshold = inv?.threshold ?? 3;
      const status = deriveStockStatus(stock, threshold);
      const isAvailable = stock >= item.quantity;

      if (!isAvailable) {
        overallAvailable = false;
      }

      return {
        productId: item.productId,
        requestedQuantity: item.quantity,
        available: isAvailable,
        status,
        message: !isAvailable
          ? stock === 0
            ? 'Item is currently out of stock.'
            : `Only ${stock} unit(s) available in stock.`
          : undefined,
      };
    });

    return {
      available: overallAvailable,
      items: itemResults,
    };
  }
}
