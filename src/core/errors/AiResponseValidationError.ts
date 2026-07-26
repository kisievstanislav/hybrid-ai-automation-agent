import { BaseAppError } from "./BaseAppError.js";

export interface AiResponseValidationErrorOptions {
  cause?: unknown;
}

export class AiResponseValidationError extends BaseAppError {
  constructor(
    message: string,
    options: AiResponseValidationErrorOptions = {},
  ) {
    super({
      code: "AI_RESPONSE_VALIDATION_ERROR",
      message,
      cause: options.cause,
      retryable: false,
    });
  }
}