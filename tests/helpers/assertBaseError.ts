import { expect } from "vitest";
import { BaseAppError } from "../../src/core/errors/BaseAppError.js";

interface AssertBaseErrorOptions {
  error: BaseAppError;
  code: string;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

export function assertBaseError({
  error,
  code,
  message,
  retryable,
  cause,
}: AssertBaseErrorOptions): void {
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(BaseAppError);

  expect(error.name).toBe(error.constructor.name);
  expect(error.code).toBe(code);
  expect(error.message).toBe(message);
  expect(error.retryable).toBe(retryable);
  expect(error.cause).toBe(cause);
}