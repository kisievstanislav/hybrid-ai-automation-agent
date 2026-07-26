import { describe, it } from "vitest";
import { ConfigurationError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../helpers/assertBaseError.js";

describe("ConfigurationError", () => {
  it("should create a non-retryable configuration error", () => {
    const cause = new Error("Missing environment variable");

    const error = new ConfigurationError(
      "Application configuration is invalid",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "CONFIGURATION_ERROR",
      message: "Application configuration is invalid",
      retryable: false,
      cause,
    });
  });
});