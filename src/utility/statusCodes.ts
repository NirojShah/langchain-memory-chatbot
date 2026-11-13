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

export const STATUS_MESSAGES = {
  API_RUNNING: "LangChain Memory Chatbot API is running!",
  VALIDATION_ERROR: "Validation Error",
  USER_REGISTERED: "User registered successfully",
  USER_UPDATED: "User updated successfully",
  USER_DEACTIVATED: "User deactivated successfully",
  LOGIN_SUCCESSFUL: "Login successful",
  LOGOUT_SUCCESSFUL: "Logout successful",
} as const;

const STATUS_MESSAGES_BY_CODE: Readonly<Record<number, string>> = {
  [OK.code]: OK.message,
  [CREATED.code]: CREATED.message,
  [ACCEPTED.code]: ACCEPTED.message,
  [NO_CONTENT.code]: NO_CONTENT.message,
  [BAD_REQUEST.code]: BAD_REQUEST.message,
  [UNAUTHORIZED.code]: UNAUTHORIZED.message,
  [FORBIDDEN.code]: FORBIDDEN.message,
  [NOT_FOUND.code]: NOT_FOUND.message,
  [METHOD_NOT_ALLOWED.code]: METHOD_NOT_ALLOWED.message,
  [REQUEST_TIMEOUT.code]: REQUEST_TIMEOUT.message,
  [CONFLICT.code]: CONFLICT.message,
  [GONE.code]: GONE.message,
  [UNPROCESSABLE_ENTITY.code]: UNPROCESSABLE_ENTITY.message,
  [TOO_MANY_REQUESTS.code]: TOO_MANY_REQUESTS.message,
  [INTERNAL_SERVER_ERROR.code]: INTERNAL_SERVER_ERROR.message,
  [NOT_IMPLEMENTED.code]: NOT_IMPLEMENTED.message,
  [BAD_GATEWAY.code]: BAD_GATEWAY.message,
  [SERVICE_UNAVAILABLE.code]: SERVICE_UNAVAILABLE.message,
  [GATEWAY_TIMEOUT.code]: GATEWAY_TIMEOUT.message,
};

export const getStatusMessage = (code: number): string =>
  STATUS_MESSAGES_BY_CODE[code] ?? INTERNAL_SERVER_ERROR.message;
