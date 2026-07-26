import { BaseAppError } from "./BaseAppError.js";

export interface ApiErrorOptions {
  retryable?: boolean;
  cause?: unknown;
}

export class ApiError extends BaseAppError {
  constructor(
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super({
      code: "API_ERROR",
      message,
      retryable: options.retryable ?? true,
      cause: options.cause,
    });
  }
}