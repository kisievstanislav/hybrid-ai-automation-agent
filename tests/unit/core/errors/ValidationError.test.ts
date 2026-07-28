import { describe, it } from "vitest";
import { ValidationError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../../helpers/assertBaseError.js";

describe("ValidationError", () => {
  it("should create a non-retryable validation error", () => {
    const cause = new Error("Invalid payload");

    const error = new ValidationError(
      "Request validation failed",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      retryable: false,
      cause,
    });
  });
});