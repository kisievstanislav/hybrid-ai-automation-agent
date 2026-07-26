import { BaseAppError } from "./BaseAppError.js";

export interface BusinessRuleErrorOptions {
  cause?: unknown;
}

export class BusinessRuleError extends BaseAppError {
  constructor(
    message: string,
    options: BusinessRuleErrorOptions = {},
  ) {
    super({
      code: "BUSINESS_RULE_ERROR",
      message,
      cause: options.cause,
      retryable: false,
    });
  }
}