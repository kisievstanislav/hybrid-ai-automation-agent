import { BaseAppError } from "./BaseAppError.js";

export interface VerificationErrorOptions {
  cause?: unknown;
}

export class VerificationError extends BaseAppError {
  constructor(
    message: string,
    options: VerificationErrorOptions = {},
  ) {
    super({
      code: "VERIFICATION_ERROR",
      message,
      cause: options.cause,
      retryable: false,
    });
  }
}