import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../auth/plugin.js';
import { CustomerService } from './service.js';
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
  orderIdParamSchema,
} from './validation.js';

export const customerRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // All customer endpoints require verified session identity via Supabase JWT
  fastify.addHook('preHandler', authenticate);

  // =========================================================================
  // Profile Endpoints
  // =========================================================================

  /**
   * GET /api/customers/me
   */
  const handleGetProfile = async (request: any, reply: any) => {
    try {
      const profile = await CustomerService.getProfile(request.user.id);
      return reply.status(200).send({ profile });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        error: err.name || 'Internal Server Error',
        message: err.message || 'Failed to fetch customer profile.',
      });
    }
  };

  fastify.get('/me', handleGetProfile);
  fastify.get('/profile', handleGetProfile);

  /**
   * PATCH /api/customers/me
   */
  const handleUpdateProfile = async (request: any, reply: any) => {
    const bodyResult = updateProfileSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid profile update payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const updated = await CustomerService.updateProfile(request.user.id, bodyResult.data);
      return reply.status(200).send({
        profile: updated,
        message: 'Profile updated successfully.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: 'Bad Request',
        message: err.message || 'Failed to update profile.',
      });
    }
  };

  fastify.patch('/me', handleUpdateProfile);
  fastify.put('/me', handleUpdateProfile);
  fastify.put('/profile', handleUpdateProfile);

  // =========================================================================
  // Address Endpoints
  // =========================================================================

  /**
   * GET /api/customers/me/addresses
   */
  const handleListAddresses = async (request: any, reply: any) => {
    try {
      const addresses = await CustomerService.listAddresses(request.user.id);
      return reply.status(200).send({
        addresses,
        total: addresses.length,
      });
    } catch (err: any) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to list customer addresses.',
      });
    }
  };

  fastify.get('/me/addresses', handleListAddresses);
  fastify.get('/addresses', handleListAddresses);

  /**
   * POST /api/customers/me/addresses
   */
  const handleCreateAddress = async (request: any, reply: any) => {
    const bodyResult = createAddressSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid address payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const address = await CustomerService.createAddress(request.user.id, bodyResult.data);
      return reply.status(201).send({
        address,
        message: 'Address saved successfully.',
      });
    } catch (err: any) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: err.message || 'Failed to create address.',
      });
    }
  };

  fastify.post('/me/addresses', handleCreateAddress);
  fastify.post('/addresses', handleCreateAddress);

  /**
   * GET /api/customers/me/addresses/:id
   */
  const handleGetAddressById = async (request: any, reply: any) => {
    const paramResult = addressIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid address ID format.',
      });
    }

    try {
      const address = await CustomerService.getAddressById(request.user.id, paramResult.data.id);
      return reply.status(200).send({ address });
    } catch (err: any) {
      return reply.status(err.statusCode || 404).send({
        statusCode: err.statusCode || 404,
        error: 'Not Found',
        message: err.message || 'Address not found.',
      });
    }
  };

  fastify.get('/me/addresses/:id', handleGetAddressById);
  fastify.get('/addresses/:id', handleGetAddressById);

  /**
   * PATCH /api/customers/me/addresses/:id
   */
  const handleUpdateAddress = async (request: any, reply: any) => {
    const paramResult = addressIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid address ID format.',
      });
    }

    const bodyResult = updateAddressSchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: bodyResult.error.errors[0]?.message || 'Invalid address update payload.',
        errors: bodyResult.error.errors,
      });
    }

    try {
      const updated = await CustomerService.updateAddress(
        request.user.id,
        paramResult.data.id,
        bodyResult.data
      );
      return reply.status(200).send({
        address: updated,
        message: 'Address updated successfully.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message || 'Failed to update address.',
      });
    }
  };

  fastify.patch('/me/addresses/:id', handleUpdateAddress);
  fastify.put('/me/addresses/:id', handleUpdateAddress);
  fastify.put('/addresses/:id', handleUpdateAddress);

  /**
   * PATCH /api/customers/me/addresses/:id/default
   */
  fastify.patch('/me/addresses/:id/default', async (request, reply) => {
    const paramResult = addressIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid address ID format.',
      });
    }

    try {
      const address = await CustomerService.setDefaultAddress(request.user!.id, paramResult.data.id);
      return reply.status(200).send({
        address,
        message: 'Default address updated.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message || 'Failed to set default address.',
      });
    }
  });

  /**
   * DELETE /api/customers/me/addresses/:id
   */
  const handleDeleteAddress = async (request: any, reply: any) => {
    const paramResult = addressIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid address ID format.',
      });
    }

    try {
      await CustomerService.deleteAddress(request.user.id, paramResult.data.id);
      return reply.status(200).send({
        ok: true,
        message: 'Address deleted successfully.',
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send({
        statusCode: err.statusCode || 400,
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message || 'Failed to delete address.',
      });
    }
  };

  fastify.delete('/me/addresses/:id', handleDeleteAddress);
  fastify.delete('/addresses/:id', handleDeleteAddress);

  // =========================================================================
  // Order History Endpoints
  // =========================================================================

  /**
   * GET /api/customers/me/orders
   */
  const handleListOrders = async (request: any, reply: any) => {
    try {
      const orders = await CustomerService.listOrders(request.user.id);
      return reply.status(200).send({
        orders,
        total: orders.length,
      });
    } catch (err: any) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to list customer orders.',
      });
    }
  };

  fastify.get('/me/orders', handleListOrders);
  fastify.get('/orders', handleListOrders);

  /**
   * GET /api/customers/me/orders/:id
   */
  const handleGetOrderById = async (request: any, reply: any) => {
    const paramResult = orderIdParamSchema.safeParse(request.params);
    if (!paramResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid order ID format.',
      });
    }

    try {
      const order = await CustomerService.getOrderById(request.user.id, paramResult.data.id);
      return reply.status(200).send({ order });
    } catch (err: any) {
      return reply.status(err.statusCode || 404).send({
        statusCode: err.statusCode || 404,
        error: 'Not Found',
        message: err.message || 'Order not found.',
      });
    }
  };

  fastify.get('/me/orders/:id', handleGetOrderById);
  fastify.get('/orders/:id', handleGetOrderById);
};
