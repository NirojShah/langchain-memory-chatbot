import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { CustomError } from "./customError.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  STATUS_MESSAGES,
  getStatusMessage,
} from "./statusCodes.js";

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
  const statusCode = fastifyError.statusCode ?? INTERNAL_SERVER_ERROR.code;

  // Handle Fastify schema validation errors
  if (fastifyError.validation) {
    return reply.status(BAD_REQUEST.code).send({
      success: false,
      statusCode: BAD_REQUEST.code,
      message: STATUS_MESSAGES.VALIDATION_ERROR,
      errors: fastifyError.validation,
    });
  }

  // Generic/Unknown errors
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? getStatusMessage(INTERNAL_SERVER_ERROR.code)
      : error.message || getStatusMessage(statusCode);

  return reply.status(statusCode).send({
    success: false,
    statusCode,
    message,
  });
};
