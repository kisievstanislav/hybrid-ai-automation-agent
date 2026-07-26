import { BaseAppError } from "./BaseAppError.js";

export interface ValidationErrorOptions {
  cause?: unknown;
}

export class ValidationError extends BaseAppError {
  constructor(
    message: string,
    options: ValidationErrorOptions = {},
  ) {
    super({
      code: "VALIDATION_ERROR",
      message,
      cause: options.cause,
      retryable: false,
    });
  }
}