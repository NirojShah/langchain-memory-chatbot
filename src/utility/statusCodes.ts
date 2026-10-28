export interface StatusCodeItem {
  readonly code: number;
  readonly message: string;
  (customMessage?: string): { code: number; message: string };
  withMessage(customMessage: string): { code: number; message: string };
}

const createStatus = (code: number, defaultMessage: string): StatusCodeItem => {
  const fn = ((customMessage?: string) => ({
    code,
    message: customMessage && customMessage.trim().length > 0 ? customMessage : defaultMessage,
  })) as StatusCodeItem;

  Object.defineProperty(fn, "code", {
    value: code,
    writable: false,
    enumerable: true,
  });

  Object.defineProperty(fn, "message", {
    value: defaultMessage,
    writable: false,
    enumerable: true,
  });

  fn.withMessage = (customMessage: string) => ({
    code,
    message: customMessage,
  });

  return fn;
};

// 2xx Success
export const OK = createStatus(200, "OK");
export const CREATED = createStatus(201, "Created");
export const ACCEPTED = createStatus(202, "Accepted");
export const NO_CONTENT = createStatus(204, "No Content");

// 4xx Client Errors
export const BAD_REQUEST = createStatus(400, "Bad Request");
export const UNAUTHORIZED = createStatus(401, "Unauthorized");
export const FORBIDDEN = createStatus(403, "Forbidden");
export const NOT_FOUND = createStatus(404, "Not Found");
export const METHOD_NOT_ALLOWED = createStatus(405, "Method Not Allowed");
export const REQUEST_TIMEOUT = createStatus(408, "Request Timeout");
export const CONFLICT = createStatus(409, "Conflict");
export const GONE = createStatus(410, "Gone");
export const UNPROCESSABLE_ENTITY = createStatus(422, "Unprocessable Entity");
export const TOO_MANY_REQUESTS = createStatus(429, "Too Many Requests");

// 5xx Server Errors
export const INTERNAL_SERVER_ERROR = createStatus(500, "Internal Server Error");
export const NOT_IMPLEMENTED = createStatus(501, "Not Implemented");
export const BAD_GATEWAY = createStatus(502, "Bad Gateway");
export const SERVICE_UNAVAILABLE = createStatus(503, "Service Unavailable");
export const GATEWAY_TIMEOUT = createStatus(504, "Gateway Timeout");

export const STATUS_CODES = {
  // 2xx
  OK,
  CREATED,
  ACCEPTED,
  NO_CONTENT,

  // 4xx
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  METHOD_NOT_ALLOWED,
  REQUEST_TIMEOUT,
  CONFLICT,
  GONE,
  UNPROCESSABLE_ENTITY,
  TOO_MANY_REQUESTS,

  // 5xx
  INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT,
} as const;

export const StatusCodes = STATUS_CODES;
