import { describe, it } from "vitest";
import { QueueError } from "../../../../src/core/errors/index.js";
import { assertBaseError } from "../../helpers/assertBaseError.js";

describe("QueueError", () => {
  it("should create a retryable queue error", () => {
    const cause = new Error("RabbitMQ connection lost");

    const error = new QueueError(
      "Failed to enqueue workflow",
      {
        cause,
      },
    );

    assertBaseError({
      error,
      code: "QUEUE_ERROR",
      message: "Failed to enqueue workflow",
      retryable: true,
      cause,
    });
  });

  it("should allow overriding retryable", () => {
    const error = new QueueError(
      "Queue is permanently unavailable",
      {
        retryable: false,
      },
    );

    assertBaseError({
      error,
      code: "QUEUE_ERROR",
      message: "Queue is permanently unavailable",
      retryable: false,
    });
  });
});