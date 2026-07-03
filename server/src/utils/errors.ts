/** Operational error with an HTTP status, safe to expose to clients. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }

  static badRequest(message: string, code = "bad_request") {
    return new ApiError(400, message, code);
  }
  static unauthorized(message = "Not authenticated", code = "unauthorized") {
    return new ApiError(401, message, code);
  }
  static forbidden(message = "Forbidden", code = "forbidden") {
    return new ApiError(403, message, code);
  }
  static notFound(message = "Not found", code = "not_found") {
    return new ApiError(404, message, code);
  }
  static conflict(message: string, code = "conflict") {
    return new ApiError(409, message, code);
  }
}
