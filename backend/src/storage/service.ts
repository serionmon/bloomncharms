import { randomUUID } from 'crypto';
import { getAdminSupabaseClient, getAnonSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  validateImageMagicBytes,
  getExtensionForMime,
  type AllowedMimeType,
} from './validation.js';

export interface ProductImageRecord {
  id: string;
  productId: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
  createdAt: string;
}

export class StorageService {
  public static readonly BUCKET_NAME = 'product-images';

  /**
   * Resolves the public CDN URL for a given Supabase Storage path.
   */
  public static getPublicUrl(storagePath: string): string {
    if (!storagePath) return '';
    // If it's already a full URL or relative local path, return as is
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('/')) {
      return storagePath;
    }

    if (!config.SUPABASE_URL) {
      return `/images/products/${storagePath.split('/').pop() || storagePath}`;
    }

    const client = config.SUPABASE_ANON_KEY ? getAnonSupabaseClient() : getAdminSupabaseClient();
    const { data } = client.storage.from(this.BUCKET_NAME).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  /**
   * Uploads a product image buffer to Supabase Storage and records it in public.product_images.
   */
  public static async uploadProductImage(params: {
    productId: string;
    buffer: Buffer;
    mimeType: string;
    originalFilename?: string;
    altText?: string;
    sortOrder?: number;
  }): Promise<ProductImageRecord> {
    const { productId, buffer, mimeType, altText = '', sortOrder = 0 } = params;

    // 1. File size check
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
    }

    // 2. MIME type check
    if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
      throw new Error(`Invalid MIME type '${mimeType}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}.`);
    }

    // 3. Magic bytes verification
    const magicCheck = validateImageMagicBytes(buffer);
    if (!magicCheck.valid) {
      throw new Error(magicCheck.error || 'Invalid image file signature.');
    }

    const client = getAdminSupabaseClient();

    // 4. Verify product exists
    const { data: product, error: productError } = await client
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error(`Product with ID '${productId}' does not exist.`);
    }

    // 5. Generate collision-free, scoped storage path
    const extension = getExtensionForMime(magicCheck.detectedMime || mimeType);
    const storagePath = `products/${productId}/${randomUUID()}${extension}`;

    // 6. Upload object to Supabase Storage
    const { error: uploadError } = await client.storage
      .from(this.BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: magicCheck.detectedMime || mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 7. Insert database row into public.product_images
    const { data: dbImage, error: dbError } = await client
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: storagePath,
        alt_text: altText,
        sort_order: sortOrder,
      })
      .select('id, product_id, storage_path, alt_text, sort_order, created_at')
      .single();

    if (dbError || !dbImage) {
      // Rollback storage object on database insert failure
      await client.storage.from(this.BUCKET_NAME).remove([storagePath]);
      throw new Error(`Failed to record product image in database: ${dbError?.message}`);
    }

    return {
      id: dbImage.id,
      productId: dbImage.product_id,
      storagePath: dbImage.storage_path,
      publicUrl: this.getPublicUrl(dbImage.storage_path),
      altText: dbImage.alt_text,
      sortOrder: dbImage.sort_order,
      createdAt: dbImage.created_at,
    };
  }

  /**
   * Replaces an existing product image with new image content.
   */
  public static async replaceProductImage(params: {
    productId: string;
    imageId: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<ProductImageRecord> {
    const { productId, imageId, buffer, mimeType } = params;

    // 1. File size check
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
    }

    // 2. MIME type & magic bytes verification
    if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
      throw new Error(`Invalid MIME type '${mimeType}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}.`);
    }

    const magicCheck = validateImageMagicBytes(buffer);
    if (!magicCheck.valid) {
      throw new Error(magicCheck.error || 'Invalid image file signature.');
    }

    const client = getAdminSupabaseClient();

    // 3. Find existing image record
    const { data: existing, error: findError } = await client
      .from('product_images')
      .select('id, product_id, storage_path, alt_text, sort_order, created_at')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();

    if (findError || !existing) {
      throw new Error(`Image '${imageId}' not found for product '${productId}'.`);
    }

    // 4. Generate new path if extension changed, or upsert to existing path
    const newExtension = getExtensionForMime(magicCheck.detectedMime || mimeType);
    const newStoragePath = `products/${productId}/${randomUUID()}${newExtension}`;

    // Upload new image
    const { error: uploadError } = await client.storage
      .from(this.BUCKET_NAME)
      .upload(newStoragePath, buffer, {
        contentType: magicCheck.detectedMime || mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage replace failed: ${uploadError.message}`);
    }

    // Update database record
    const { data: updated, error: updateError } = await client
      .from('product_images')
      .update({
        storage_path: newStoragePath,
      })
      .eq('id', imageId)
      .select('id, product_id, storage_path, alt_text, sort_order, created_at')
      .single();

    if (updateError || !updated) {
      await client.storage.from(this.BUCKET_NAME).remove([newStoragePath]);
      throw new Error(`Failed to update product image record: ${updateError?.message}`);
    }

    // Delete old storage object if path changed
    if (existing.storage_path !== newStoragePath) {
      await client.storage.from(this.BUCKET_NAME).remove([existing.storage_path]);
    }

    return {
      id: updated.id,
      productId: updated.product_id,
      storagePath: updated.storage_path,
      publicUrl: this.getPublicUrl(updated.storage_path),
      altText: updated.alt_text,
      sortOrder: updated.sort_order,
      createdAt: updated.created_at,
    };
  }

  /**
   * Deletes a product image from storage and removes its record from the database.
   */
  public static async deleteProductImage(productId: string, imageId: string): Promise<boolean> {
    const client = getAdminSupabaseClient();

    // 1. Fetch image record to obtain storage_path
    const { data: existing, error: findError } = await client
      .from('product_images')
      .select('id, storage_path')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();

    if (findError || !existing) {
      throw new Error(`Image '${imageId}' not found for product '${productId}'.`);
    }

    // 2. Delete database record
    const { error: dbDeleteError } = await client
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId);

    if (dbDeleteError) {
      throw new Error(`Failed to delete product image record: ${dbDeleteError.message}`);
    }

    // 3. Delete from Supabase Storage
    if (existing.storage_path) {
      await client.storage.from(this.BUCKET_NAME).remove([existing.storage_path]);
    }

    return true;
  }

  /**
   * Updates metadata (altText, sortOrder) of an existing product image.
   */
  public static async updateImageMetadata(
    productId: string,
    imageId: string,
    metadata: { altText?: string; sortOrder?: number }
  ): Promise<ProductImageRecord> {
    const client = getAdminSupabaseClient();

    const updatePayload: { alt_text?: string; sort_order?: number } = {};
    if (metadata.altText !== undefined) updatePayload.alt_text = metadata.altText;
    if (metadata.sortOrder !== undefined) updatePayload.sort_order = metadata.sortOrder;

    const { data: updated, error } = await client
      .from('product_images')
      .update(updatePayload)
      .eq('id', imageId)
      .eq('product_id', productId)
      .select('id, product_id, storage_path, alt_text, sort_order, created_at')
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update image metadata: ${error?.message || 'Image not found'}`);
    }

    return {
      id: updated.id,
      productId: updated.product_id,
      storagePath: updated.storage_path,
      publicUrl: this.getPublicUrl(updated.storage_path),
      altText: updated.alt_text,
      sortOrder: updated.sort_order,
      createdAt: updated.created_at,
    };
  }

  /**
   * Fetches all image records for a given product with resolved public URLs.
   */
  public static async getProductImages(productId: string): Promise<ProductImageRecord[]> {
    const hasSupabase = Boolean(config.SUPABASE_URL && (config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY));
    if (!hasSupabase) {
      return [];
    }

    const client = config.SUPABASE_ANON_KEY ? getAnonSupabaseClient() : getAdminSupabaseClient();

    const { data, error } = await client
      .from('product_images')
      .select('id, product_id, storage_path, alt_text, sort_order, created_at')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((img) => ({
      id: img.id,
      productId: img.product_id,
      storagePath: img.storage_path,
      publicUrl: this.getPublicUrl(img.storage_path),
      altText: img.alt_text,
      sortOrder: img.sort_order,
      createdAt: img.created_at,
    }));
  }
}

