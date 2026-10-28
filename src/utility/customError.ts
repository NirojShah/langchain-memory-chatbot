import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
  type StatusCodeItem,
} from "./statusCodes.js";

export type StatusInput = { code: number; message: string };

export class CustomError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(status: StatusCodeItem | StatusInput, customMessage?: string, isOperational?: boolean);
  constructor(message: string, statusCode?: number, isOperational?: boolean);
  constructor(
    arg1: string | StatusCodeItem | StatusInput,
    arg2?: number | string,
    arg3: boolean = true
  ) {
    let message: string;
    let statusCode: number;
    let isOperational: boolean = arg3;

    if (
      (typeof arg1 === "object" || typeof arg1 === "function") &&
      arg1 !== null &&
      "code" in arg1 &&
      "message" in arg1
    ) {
      statusCode = arg1.code;
      message = typeof arg2 === "string" && arg2.trim().length > 0 ? arg2 : arg1.message;
    } else {
      message = typeof arg1 === "string" ? arg1 : "An error occurred";
      statusCode = typeof arg2 === "number" ? arg2 : 500;
    }

    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(customMessage?: string) {
    return new CustomError(BAD_REQUEST, customMessage);
  }

  static unauthorized(customMessage?: string) {
    return new CustomError(UNAUTHORIZED, customMessage);
  }

  static forbidden(customMessage?: string) {
    return new CustomError(FORBIDDEN, customMessage);
  }

  static notFound(customMessage?: string) {
    return new CustomError(NOT_FOUND, customMessage);
  }

  static conflict(customMessage?: string) {
    return new CustomError(CONFLICT, customMessage);
  }

  static internal(customMessage?: string) {
    return new CustomError(INTERNAL_SERVER_ERROR, customMessage);
  }
}
