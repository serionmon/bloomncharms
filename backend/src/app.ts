import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
    trustProxy: true, // Trust Caddy reverse proxy headers (X-Forwarded-For, X-Forwarded-Proto)
    ...opts,
  });

  // Sensible defaults and HTTP error utilities
  await app.register(sensible);

  // Production security headers
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Delegated to Caddy / Next.js to avoid breaking external Razorpay checkout scripts
  });

  // Global rate limiting with sensible budgets
  await app.register(rateLimit, {
    max: config.NODE_ENV === 'test' ? 1000 : 120, // 120 requests per minute
    timeWindow: '1 minute',
    allowList: (req) => {
      // Exempt health checks and inbound provider webhooks from rate limiting
      return (
        req.url === '/api/health' ||
        req.url === '/api/payments/razorpay/webhook' ||
        req.url === '/api/shipping/webhook'
      );
    },
  });

  // Preserve raw body buffer for webhook signature verifications
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      (req as any).rawBody = body;
      try {
        const json = body.length > 0 ? JSON.parse(body.toString('utf-8')) : {};
        done(null, json);
      } catch (err: any) {
        done(err, undefined);
      }
    }
  );

  // Multipart support for file uploads (10MB limit)
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // CORS configuration: supports configured FRONTEND_URL and same-origin reverse-proxied requests
  const allowedOrigins = config.FRONTEND_URL.includes(',')
    ? config.FRONTEND_URL.split(',').map((url) => url.trim())
    : [config.FRONTEND_URL.trim()];

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, or same-origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return cb(null, true);
      }
      return cb(new Error('Cross-Origin Request Blocked by Bloomncharms Policy'), false);
    },
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
