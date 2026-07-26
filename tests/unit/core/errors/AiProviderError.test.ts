import { describe, it } from "vitest";
import { AiProviderError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../helpers/assertBaseError.js";

describe("AiProviderError", () => {
  it("should create a retryable AI provider error", () => {
    const cause = new Error("OpenAI request timed out");

    const error = new AiProviderError(
      "Failed to communicate with AI provider",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "AI_PROVIDER_ERROR",
      message: "Failed to communicate with AI provider",
      retryable: true,
      cause,
    });
  });

  it("should allow overriding retryable", () => {
    const error = new AiProviderError(
      "AI provider authentication failed",
      {
        retryable: false,
      },
    );

    assertBaseError({
      error,
      code: "AI_PROVIDER_ERROR",
      message: "AI provider authentication failed",
      retryable: false,
    });
  });
});