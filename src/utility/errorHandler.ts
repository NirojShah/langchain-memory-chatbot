import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { CustomError } from "./customError.js";

export const globalErrorHandler = (
  error: FastifyError | CustomError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error);

  if (error instanceof CustomError) {
    return reply.status(error.statusCode).send({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
    });
  }

  const fastifyError = error as FastifyError;
  const statusCode = fastifyError.statusCode ?? 500;

  // Handle Fastify schema validation errors
  if (fastifyError.validation) {
    return reply.status(statusCode).send({
      success: false,
      statusCode,
      message: "Validation Error",
      errors: fastifyError.validation,
    });
  }

  // Generic/Unknown errors
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : error.message || "An unexpected error occurred";

  return reply.status(statusCode).send({
    success: false,
    statusCode,
    message,
  });
};
