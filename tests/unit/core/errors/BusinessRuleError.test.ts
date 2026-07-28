import { describe, it } from "vitest";
import { BusinessRuleError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../../helpers/assertBaseError.js";

describe("BusinessRuleError", () => {
  it("should create a non-retryable business rule error", () => {
    const cause = new Error("Loan amount exceeds allowed limit");

    const error = new BusinessRuleError(
      "Mortgage business rule validation failed",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "BUSINESS_RULE_ERROR",
      message: "Mortgage business rule validation failed",
      retryable: false,
      cause,
    });
  });
});