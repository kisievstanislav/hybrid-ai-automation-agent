import { BaseAppError } from "./BaseAppError.js";

export interface UiAutomationErrorOptions {
  retryable?: boolean;
  cause?: unknown;
}

export class UiAutomationError extends BaseAppError {
  constructor(
    message: string,
    options: UiAutomationErrorOptions = {},
  ) {
    super({
      code: "UI_AUTOMATION_ERROR",
      message,
      cause: options.cause,
      retryable: options.retryable ?? true,
    });
  }
}