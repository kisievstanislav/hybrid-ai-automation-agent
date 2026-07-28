import { describe, it } from "vitest";
import { UiAutomationError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../../helpers/assertBaseError.js";

describe("UiAutomationError", () => {
  it("should create a retryable UI automation error", () => {
    const cause = new Error("Element was not found");

    const error = new UiAutomationError(
      "Playwright action failed",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "UI_AUTOMATION_ERROR",
      message: "Playwright action failed",
      retryable: true,
      cause,
    });
  });

  it("should allow overriding retryable", () => {
    const error = new UiAutomationError(
      "Page structure is permanently incompatible",
      {
        retryable: false,
      },
    );

    assertBaseError({
      error,
      code: "UI_AUTOMATION_ERROR",
      message: "Page structure is permanently incompatible",
      retryable: false,
    });
  });
});