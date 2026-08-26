import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAdmin } from '../auth/plugin.js';
import { StorageService } from '../storage/service.js';
import { AdminProductService } from './service.js';
import {
  productIdParamSchema,
  productImageParamsSchema,
  updateImageMetadataSchema,
} from '../storage/validation.js';
import {
  createProductSchema,
  updateProductSchema,
} from './validation.js';

export const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // =========================================================================
  // Admin Products Management (Milestone 5)
  // Protected by authenticate + requireAdmin
  // =========================================================================

  /**
   * GET /api/admin/products
   * Returns list of all products (including inactive) with inventory & images.
   */
  fastify.get('/products', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const products = await AdminProductService.listProducts();
      return reply.status(200).send({
        products,
        total: products.length,
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        error: err.name || 'Internal Server Error',
        message: err.message || 'Failed to list admin products.',
      });
    }
  });

  /**
   * GET /api/admin/products/:id
   * Returns a single product by ID.
   */
  fastify.get('/products/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid product ID.',
      });
    }

    try {
      const product = await AdminProductService.getProductById(paramResult.data.id);
      if (!product) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Product with ID '${paramResult.data.id}' not found.`,
        });
      }

      return reply.status(200).send({
        product,
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        error: err.name || 'Internal Server Error',
        message: err.message || 'Failed to get product.',
      });
    }
  });

  /**
   * POST /api/admin/products
   * Creates a new product and associated inventory record.
   */
  fastify.post('/products', { preHandler: requireAdmin }, async (request, reply) => {
    const bodyResult = createProductSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid product payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const product = await AdminProductService.createProduct(bodyResult.data);
      return reply.status(201).send({
        product,
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 409 ? 'Conflict' : 'Bad Request',
        message: err.message || 'Failed to create product.',
      });
    }
  });

  /**
   * PUT /api/admin/products/:id
   * Updates an existing product and its inventory parameters.
   */
  fastify.put('/products/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid product ID.',
      });
    }

    const bodyResult = updateProductSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid update payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const updated = await AdminProductService.updateProduct(paramResult.data.id, bodyResult.data);
      return reply.status(200).send({
        product: updated,
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 404 ? 'Not Found' : err.statusCode === 409 ? 'Conflict' : 'Bad Request',
        message: err.message || 'Failed to update product.',
      });
    }
  });

  /**
   * PATCH /api/admin/products/:id/deactivate
   * Deactivates a product (soft delete).
   */
  fastify.patch('/products/:id/deactivate', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid product ID.',
      });
    }

    try {
      const product = await AdminProductService.deactivateProduct(paramResult.data.id);
      return reply.status(200).send({
        product,
        message: 'Product deactivated successfully.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message || 'Failed to deactivate product.',
      });
    }
  });

  /**
   * DELETE /api/admin/products/:id
   * Deactivates (soft-deletes) a product by setting is_active = false.
   *
   * Hard physical deletion is intentionally NOT available via the API because
   * existing order_items reference product IDs.  Deactivation removes the product
   * from the storefront while keeping historical order data intact.
   * Images are preserved so a reactivation restores the full product.
   */
  fastify.delete('/products/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid product ID.',
      });
    }

    try {
      const product = await AdminProductService.deactivateProduct(paramResult.data.id);
      return reply.status(200).send({
        product,
        message: 'Product deactivated. Historical orders remain intact. Use PUT to reactivate.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message || 'Failed to deactivate product.',
      });
    }
  });

  // =========================================================================
  // Product Image Management Endpoints (Milestone 4)
  // Protected by authenticate + requireAdmin
  // =========================================================================

  /**
   * POST /api/admin/products/:id/images
   * Uploads and attaches an image to a product.
   * Supports multipart/form-data as well as application/json (base64).
   */
  fastify.post('/products/:id/images', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid product ID.',
      });
    }

    const productId = paramResult.data.id;
    let fileBuffer: Buffer;
    let mimeType: string;
    let filename: string | undefined;
    let altText: string | undefined;
    let sortOrder: number | undefined;

    if (request.isMultipart()) {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No file uploaded in multipart form data.',
        });
      }

      fileBuffer = await data.toBuffer();
      mimeType = data.mimetype;
      filename = data.filename;

      const fields = data.fields as Record<string, any>;
      if (fields?.altText?.value) altText = String(fields.altText.value);
      if (fields?.sortOrder?.value) sortOrder = Number(fields.sortOrder.value);
    } else {
      const body = request.body as {
        file?: string;
        mimeType?: string;
        filename?: string;
        altText?: string;
        sortOrder?: number;
      };

      if (!body || !body.file || !body.mimeType) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required file data or mimeType in request body.',
        });
      }

      fileBuffer = Buffer.from(body.file, 'base64');
      mimeType = body.mimeType;
      filename = body.filename;
      altText = body.altText;
      sortOrder = body.sortOrder;
    }

    try {
      const imageRecord = await StorageService.uploadProductImage({
        productId,
        buffer: fileBuffer,
        mimeType,
        originalFilename: filename,
        altText,
        sortOrder,
      });

      return reply.status(201).send({
        image: imageRecord,
      });
    } catch (err: any) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err?.message || 'Failed to upload product image.',
      });
    }
  });

  /**
   * PATCH /api/admin/products/:id/images/:imageId
   * Updates metadata (altText, sortOrder) of an attached product image.
   */
  fastify.patch('/products/:id/images/:imageId', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productImageParamsSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid parameters.',
      });
    }

    const bodyResult = updateImageMetadataSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid image metadata payload.',
      });
    }

    try {
      const updated = await StorageService.updateImageMetadata(
        paramResult.data.id,
        paramResult.data.imageId,
        bodyResult.data
      );

      return reply.status(200).send({
        image: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err?.message || 'Failed to update image metadata.',
      });
    }
  });

  /**
   * DELETE /api/admin/products/:id/images/:imageId
   * Removes a product image from storage and deletes the database record.
   */
  fastify.delete('/products/:id/images/:imageId', { preHandler: requireAdmin }, async (request, reply) => {
    const paramResult = productImageParamsSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: paramResult.error.errors[0]?.message || 'Invalid parameters.',
      });
    }

    try {
      await StorageService.deleteProductImage(
        paramResult.data.id,
        paramResult.data.imageId
      );

      return reply.status(200).send({
        ok: true,
        message: 'Product image deleted successfully.',
      });
    } catch (err: any) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err?.message || 'Failed to delete product image.',
      });
    }
  });

  // =========================================================================
  // Stubs for future milestones (Milestone 6+)
  // =========================================================================

  fastify.get('/orders', async (_request, reply) => {
    return reply.status(501).send({ message: 'Admin orders list foundation prepared.' });
  });

  fastify.put('/orders/:id/status', async (_request, reply) => {
    return reply.status(501).send({ message: 'Admin order status update foundation prepared.' });
  });

  fastify.get('/inventory', async (_request, reply) => {
    return reply.status(501).send({ message: 'Admin inventory management foundation prepared.' });
  });
};
