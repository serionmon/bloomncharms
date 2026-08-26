import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: error.flatten(),
    });
  }

  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 ? 'An unexpected server error occurred.' : error.message,
  });
}
