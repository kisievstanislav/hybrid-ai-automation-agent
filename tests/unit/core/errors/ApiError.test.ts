import { describe, it } from "vitest";
import { ApiError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../../helpers/assertBaseError.js";

describe("ApiError", () => {
  it("should create a retryable API error", () => {
    const cause = new Error("Connection refused");

    const error = new ApiError(
      "Ticket API is temporarily unavailable",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "API_ERROR",
      message: "Ticket API is temporarily unavailable",
      retryable: true,
      cause,
    });
  });

  it("should allow overriding retryable", () => {
    const error = new ApiError(
      "API endpoint is permanently unavailable",
      {
        retryable: false,
      },
    );

    assertBaseError({
      error,
      code: "API_ERROR",
      message: "API endpoint is permanently unavailable",
      retryable: false,
    });
  });
});