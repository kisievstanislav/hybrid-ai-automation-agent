import { logger } from "../logging/index.js";
import { BaseAppError } from "./BaseAppError.js";

export function logError(error: BaseAppError): void {
  logger.error(
    {
      code: error.code,
      retryable: error.retryable,
      cause: error.cause,
      err: error,
    },
    error.message,
  );
}