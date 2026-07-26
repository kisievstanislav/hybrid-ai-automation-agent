import { describe, it } from "vitest";
import { AiResponseValidationError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../helpers/assertBaseError.js";

describe("AiResponseValidationError", () => {
  it("should create a non-retryable AI response validation error", () => {
    const cause = new Error("Missing required JSON field");

    const error = new AiResponseValidationError(
      "AI response failed validation",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "AI_RESPONSE_VALIDATION_ERROR",
      message: "AI response failed validation",
      retryable: false,
      cause,
    });
  });
});