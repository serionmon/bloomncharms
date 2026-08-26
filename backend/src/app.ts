import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { config } from './common/config.js';
import { errorHandler } from './common/errors.js';
import { authRoutes } from './auth/routes.js';
import { productRoutes } from './products/routes.js';
import { categoryRoutes } from './categories/routes.js';
import { inventoryRoutes } from './inventory/routes.js';
import { orderRoutes } from './orders/routes.js';
import { discountRoutes } from './discounts/routes.js';
import { customerRoutes } from './customers/routes.js';
import { paymentRoutes } from './payments/routes.js';
import { shippingRoutes } from './shipping/routes.js';
import { adminRoutes } from './admin/routes.js';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: config.NODE_ENV === 'test' ? false : {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    ...opts,
  });

  // Sensible defaults and HTTP error utilities
  await app.register(sensible);

  // Multipart support for file uploads (10MB limit)
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // CORS configuration driven by FRONTEND_URL environment variable
  const allowedOrigins = config.FRONTEND_URL.includes(',')
    ? config.FRONTEND_URL.split(',').map((url) => url.trim())
    : [config.FRONTEND_URL.trim()];

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Standard custom error handler
  app.setErrorHandler(errorHandler);

  // Health check endpoint (Public)
  app.get('/api/health', async (_request, reply) => {
    return reply.status(200).send({
      ok: true,
      service: 'bloomncharms-backend',
    });
  });

  // Modular API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(inventoryRoutes, { prefix: '/api/inventory' });
  await app.register(orderRoutes, { prefix: '/api/orders' });
  await app.register(discountRoutes, { prefix: '/api/discounts' });
  await app.register(customerRoutes, { prefix: '/api/customers' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(shippingRoutes, { prefix: '/api/shipping' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  return app;
}
