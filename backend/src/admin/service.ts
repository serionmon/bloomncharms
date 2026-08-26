import { getAdminSupabaseClient, getAnonSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';
import { StorageService } from '../storage/service.js';
import { slugify, type CreateProductInput, type UpdateProductInput } from './validation.js';

export interface AdminProductDTO {
  id: string;
  sku?: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  altText: string;
  badge?: string;
  tag?: string;
  isCustomizable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  processingDays?: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  inventory?: {
    stockQuantity: number;
    lowStockThreshold: number;
  };
  images?: {
    id: string;
    storagePath: string;
    publicUrl: string;
    altText: string;
    sortOrder: number;
  }[];
}

export class AdminProductService {
  /**
   * Retrieves all products (including active and inactive) with inventory and category details.
   */
  public static async listProducts(): Promise<AdminProductDTO[]> {
    const hasSupabase = Boolean(config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY));

    if (!hasSupabase) {
      return [];
    }

    const client = config.SUPABASE_SERVICE_ROLE_KEY ? getAdminSupabaseClient() : getAnonSupabaseClient();

    const { data, error } = await client
      .from('products')
      .select(`
        id,
        sku,
        slug,
        name,
        subtitle,
        description,
        price,
        currency,
        image_url,
        alt_text,
        badge,
        tag,
        is_customizable,
        is_featured,
        is_bestseller,
        is_active,
        processing_days,
        created_at,
        updated_at,
        categories (
          id,
          name,
          slug
        ),
        inventory (
          stock_quantity,
          low_stock_threshold
        ),
        product_images (
          id,
          storage_path,
          alt_text,
          sort_order
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      throw new Error(`Failed to list admin products: ${error?.message || 'Unknown database error'}`);
    }

    return data.map((item: any) => ({
      id: item.id,
      sku: item.sku || undefined,
      slug: item.slug,
      name: item.name,
      subtitle: item.subtitle || undefined,
      description: item.description,
      price: Number(item.price),
      currency: item.currency,
      imageUrl: item.image_url ? StorageService.getPublicUrl(item.image_url) : undefined,
      altText: item.alt_text || '',
      badge: item.badge || undefined,
      tag: item.tag || undefined,
      isCustomizable: item.is_customizable,
      isFeatured: item.is_featured,
      isBestseller: item.is_bestseller,
      isActive: item.is_active,
      processingDays: item.processing_days || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      category: item.categories
        ? {
            id: item.categories.id,
            name: item.categories.name,
            slug: item.categories.slug,
          }
        : undefined,
      inventory: item.inventory
        ? {
            stockQuantity: item.inventory.stock_quantity ?? 0,
            lowStockThreshold: item.inventory.low_stock_threshold ?? 3,
          }
        : undefined,
      images: Array.isArray(item.product_images)
        ? item.product_images.map((img: any) => ({
            id: img.id,
            storagePath: img.storage_path,
            publicUrl: StorageService.getPublicUrl(img.storage_path),
            altText: img.alt_text,
            sortOrder: img.sort_order,
          }))
        : [],
    }));
  }

  /**
   * Retrieves a single product by ID with all relations.
   */
  public static async getProductById(id: string): Promise<AdminProductDTO | null> {
    const client = getAdminSupabaseClient();

    const { data, error } = await client
      .from('products')
      .select(`
        id,
        sku,
        slug,
        name,
        subtitle,
        description,
        price,
        currency,
        image_url,
        alt_text,
        badge,
        tag,
        is_customizable,
        is_featured,
        is_bestseller,
        is_active,
        processing_days,
        created_at,
        updated_at,
        categories (
          id,
          name,
          slug
        ),
        inventory (
          stock_quantity,
          low_stock_threshold
        ),
        product_images (
          id,
          storage_path,
          alt_text,
          sort_order
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const item = data as any;
    return {
      id: item.id,
      sku: item.sku || undefined,
      slug: item.slug,
      name: item.name,
      subtitle: item.subtitle || undefined,
      description: item.description,
      price: Number(item.price),
      currency: item.currency,
      imageUrl: item.image_url ? StorageService.getPublicUrl(item.image_url) : undefined,
      altText: item.alt_text || '',
      badge: item.badge || undefined,
      tag: item.tag || undefined,
      isCustomizable: item.is_customizable,
      isFeatured: item.is_featured,
      isBestseller: item.is_bestseller,
      isActive: item.is_active,
      processingDays: item.processing_days || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      category: item.categories
        ? {
            id: item.categories.id,
            name: item.categories.name,
            slug: item.categories.slug,
          }
        : undefined,
      inventory: item.inventory
        ? {
            stockQuantity: item.inventory.stock_quantity ?? 0,
            lowStockThreshold: item.inventory.low_stock_threshold ?? 3,
          }
        : undefined,
      images: Array.isArray(item.product_images)
        ? item.product_images.map((img: any) => ({
            id: img.id,
            storagePath: img.storage_path,
            publicUrl: StorageService.getPublicUrl(img.storage_path),
            altText: img.alt_text,
            sortOrder: img.sort_order,
          }))
        : [],
    };
  }

  /**
   * Creates a new product and creates its associated inventory record.
   */
  public static async createProduct(input: CreateProductInput): Promise<AdminProductDTO> {
    const client = getAdminSupabaseClient();

    // 1. Determine final slug
    const finalSlug = input.slug || slugify(input.name);

    // 2. Check for duplicate slug
    const { data: existingSlug } = await client
      .from('products')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (existingSlug) {
      const error: any = new Error(`A product with slug '${finalSlug}' already exists.`);
      error.statusCode = 409;
      throw error;
    }

    // 3. Check for duplicate SKU if provided
    if (input.sku) {
      const { data: existingSku } = await client
        .from('products')
        .select('id')
        .eq('sku', input.sku)
        .maybeSingle();

      if (existingSku) {
        const error: any = new Error(`A product with SKU '${input.sku}' already exists.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 4. Insert into products
    const { data: product, error: productError } = await client
      .from('products')
      .insert({
        name: input.name,
        slug: finalSlug,
        sku: input.sku || null,
        category_id: input.categoryId || null,
        subtitle: input.subtitle || null,
        description: input.description ?? '',
        price: input.price,
        currency: input.currency || 'INR',
        image_url: input.imageUrl || null,
        alt_text: input.altText || '',
        badge: input.badge || null,
        tag: input.tag || null,
        is_customizable: input.isCustomizable ?? false,
        is_featured: input.isFeatured ?? false,
        is_bestseller: input.isBestseller ?? false,
        is_active: input.isActive ?? true,
        processing_days: input.processingDays ?? null,
      })
      .select('id')
      .single();

    if (productError || !product) {
      throw new Error(`Failed to create product: ${productError?.message}`);
    }

    // 5. Insert into inventory
    const { error: invError } = await client.from('inventory').insert({
      product_id: product.id,
      stock_quantity: input.stockQuantity ?? 0,
      low_stock_threshold: input.lowStockThreshold ?? 3,
    });

    if (invError) {
      // Clean up product on inventory failure
      await client.from('products').delete().eq('id', product.id);
      throw new Error(`Failed to initialize product inventory: ${invError.message}`);
    }

    const fullProduct = await this.getProductById(product.id);
    if (!fullProduct) {
      throw new Error('Product created but failed to retrieve record.');
    }

    return fullProduct;
  }

  /**
   * Updates an existing product and optional inventory parameters.
   */
  public static async updateProduct(id: string, input: UpdateProductInput): Promise<AdminProductDTO> {
    const client = getAdminSupabaseClient();

    // 1. Verify product exists
    const { data: currentProduct, error: findError } = await client
      .from('products')
      .select('id, slug, sku')
      .eq('id', id)
      .maybeSingle();

    if (findError || !currentProduct) {
      const error: any = new Error(`Product with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    // 2. Check slug uniqueness if changing slug
    if (input.slug && input.slug !== currentProduct.slug) {
      const { data: duplicateSlug } = await client
        .from('products')
        .select('id')
        .eq('slug', input.slug)
        .neq('id', id)
        .maybeSingle();

      if (duplicateSlug) {
        const error: any = new Error(`A product with slug '${input.slug}' already exists.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 3. Check SKU uniqueness if changing SKU
    if (input.sku && input.sku !== currentProduct.sku) {
      const { data: duplicateSku } = await client
        .from('products')
        .select('id')
        .eq('sku', input.sku)
        .neq('id', id)
        .maybeSingle();

      if (duplicateSku) {
        const error: any = new Error(`A product with SKU '${input.sku}' already exists.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 4. Build product update payload
    const updatePayload: Record<string, unknown> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.sku !== undefined) updatePayload.sku = input.sku;
    if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId;
    if (input.subtitle !== undefined) updatePayload.subtitle = input.subtitle;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.price !== undefined) updatePayload.price = input.price;
    if (input.currency !== undefined) updatePayload.currency = input.currency;
    if (input.imageUrl !== undefined) updatePayload.image_url = input.imageUrl;
    if (input.altText !== undefined) updatePayload.alt_text = input.altText;
    if (input.badge !== undefined) updatePayload.badge = input.badge;
    if (input.tag !== undefined) updatePayload.tag = input.tag;
    if (input.isCustomizable !== undefined) updatePayload.is_customizable = input.isCustomizable;
    if (input.isFeatured !== undefined) updatePayload.is_featured = input.isFeatured;
    if (input.isBestseller !== undefined) updatePayload.is_bestseller = input.isBestseller;
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;
    if (input.processingDays !== undefined) updatePayload.processing_days = input.processingDays;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await client
        .from('products')
        .update(updatePayload as any)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }
    }

    // 5. Update inventory if provided
    if (input.stockQuantity !== undefined || input.lowStockThreshold !== undefined) {
      const invPayload: Record<string, unknown> = {};
      if (input.stockQuantity !== undefined) invPayload.stock_quantity = input.stockQuantity;
      if (input.lowStockThreshold !== undefined) invPayload.low_stock_threshold = input.lowStockThreshold;

      const { error: invUpdateError } = await client
        .from('inventory')
        .upsert(
          {
            product_id: id,
            ...invPayload,
          } as any,
          { onConflict: 'product_id' }
        );

      if (invUpdateError) {
        throw new Error(`Failed to update product inventory: ${invUpdateError.message}`);
      }
    }

    const fullUpdated = await this.getProductById(id);
    if (!fullUpdated) {
      throw new Error('Product updated but failed to retrieve record.');
    }

    return fullUpdated;
  }

  /**
   * Deactivates a product (soft delete).
   */
  public static async deactivateProduct(id: string): Promise<AdminProductDTO> {
    return await this.updateProduct(id, { isActive: false });
  }

  /**
   * Deletes a product permanently and removes associated images and inventory.
   */
  public static async deleteProduct(id: string): Promise<boolean> {
    const client = getAdminSupabaseClient();

    // Verify existence
    const { data: existing, error: findError } = await client
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError || !existing) {
      const error: any = new Error(`Product with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    const { error } = await client.from('products').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    return true;
  }
}
