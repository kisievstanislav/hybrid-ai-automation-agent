import { describe, expect, it } from "vitest";
import { BaseAppError } from "../../../../src/core/errors/BaseAppError.js";

describe("BaseAppError", () => {
  it("should create an application error with the provided properties", () => {
    const cause = new Error("Original failure");

    const error = new BaseAppError({
      code: "TEST_ERROR",
      message: "Something went wrong",
      cause,
      retryable: true,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.name).toBe("BaseAppError");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("Something went wrong");
    expect(error.cause).toBe(cause);
    expect(error.retryable).toBe(true);
  });

  it("should default retryable to false", () => {
    const error = new BaseAppError({
      code: "TEST_ERROR",
      message: "Something went wrong",
    });

    expect(error.retryable).toBe(false);
  });
});