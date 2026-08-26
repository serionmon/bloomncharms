import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const productIdParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format. Must be a valid UUID.'),
});

export const productImageParamsSchema = z.object({
  id: z.string().uuid('Invalid product ID format. Must be a valid UUID.'),
  imageId: z.string().uuid('Invalid image ID format. Must be a valid UUID.'),
});

export const uploadImageMetadataSchema = z.object({
  altText: z.string().max(255, 'Alt text must not exceed 255 characters.').optional().default(''),
  sortOrder: z.coerce.number().int().min(0, 'Sort order must be an integer >= 0.').optional().default(0),
});

export const updateImageMetadataSchema = z.object({
  altText: z.string().max(255, 'Alt text must not exceed 255 characters.').optional(),
  sortOrder: z.coerce.number().int().min(0, 'Sort order must be an integer >= 0.').optional(),
});

export type UploadImageMetadata = z.infer<typeof uploadImageMetadataSchema>;
export type UpdateImageMetadata = z.infer<typeof updateImageMetadataSchema>;

/**
 * Validates file buffer magic bytes to ensure file contents genuinely match
 * expected image formats (prevents MIME spoofing).
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; detectedMime?: AllowedMimeType; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File is too small or empty to be a valid image.' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // 3. WebP: 'RIFF' .... 'WEBP'
  const riffHeader = buffer.subarray(0, 4).toString('ascii');
  const webpHeader = buffer.subarray(8, 12).toString('ascii');
  if (riffHeader === 'RIFF' && webpHeader === 'WEBP') {
    return { valid: true, detectedMime: 'image/webp' };
  }

  return {
    valid: false,
    error: 'File content does not match allowed image formats (JPEG, PNG, WebP).',
  };
}

/**
 * Normalizes file extension for a given MIME type.
 */
export function getExtensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}
