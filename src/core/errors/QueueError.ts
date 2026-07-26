import { BaseAppError } from "./BaseAppError.js";

export interface QueueErrorOptions {
  retryable?: boolean;
  cause?: unknown;
}

export class QueueError extends BaseAppError {
  constructor(
    message: string,
    options: QueueErrorOptions = {},
  ) {
    super({
      code: "QUEUE_ERROR",
      message,
      cause: options.cause,
      retryable: options.retryable ?? true,
    });
  }
}