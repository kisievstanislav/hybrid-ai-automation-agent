import { describe, it } from "vitest";
import { VerificationError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../../helpers/assertBaseError.js";

describe("VerificationError", () => {
  it("should create a non-retryable verification error", () => {
    const cause = new Error("Verification failed");

    const error = new VerificationError(
      "Workflow verification failed",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "VERIFICATION_ERROR",
      message: "Workflow verification failed",
      retryable: false,
      cause,
    });
  });
});