import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const paymentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/create-order', async (request, reply) => {
    return reply.status(501).send({
      message: 'Payment order creation foundation prepared (Razorpay integration deferred).',
    });
  });

  fastify.post('/verify', async (request, reply) => {
    return reply.status(501).send({
      message: 'Payment verification foundation prepared (Razorpay integration deferred).',
    });
  });

  fastify.post('/webhook', async (request, reply) => {
    return reply.status(501).send({
      message: 'Payment webhook foundation prepared (Razorpay integration deferred).',
    });
  });
};
