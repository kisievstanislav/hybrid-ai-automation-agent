import { describe, expect, it } from "vitest";

import { ExponentialBackoffStrategy } from "../../../../src/application/queue/ExponentialBackoffStrategy.js";

describe("ExponentialBackoffStrategy", () => {
  it("should calculate exponential delays", () => {
    const strategy = new ExponentialBackoffStrategy({
      baseDelayMs: 1_000,
      maxDelayMs: 30_000,
    });

    expect(strategy.calculateDelayMs(1)).toBe(1_000);
    expect(strategy.calculateDelayMs(2)).toBe(2_000);
    expect(strategy.calculateDelayMs(3)).toBe(4_000);
    expect(strategy.calculateDelayMs(4)).toBe(8_000);
  });

  it("should not exceed the maximum delay", () => {
    const strategy = new ExponentialBackoffStrategy({
      baseDelayMs: 1_000,
      maxDelayMs: 5_000,
    });

    expect(strategy.calculateDelayMs(4)).toBe(5_000);
    expect(strategy.calculateDelayMs(10)).toBe(5_000);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "should reject invalid attempt number %s",
    (attemptNumber) => {
      const strategy = new ExponentialBackoffStrategy({
        baseDelayMs: 1_000,
        maxDelayMs: 30_000,
      });

      expect(() =>
        strategy.calculateDelayMs(attemptNumber),
      ).toThrow(
        "Attempt number must be a positive integer.",
      );
    },
  );

  it("should reject a non-positive base delay", () => {
    expect(
      () =>
        new ExponentialBackoffStrategy({
          baseDelayMs: 0,
          maxDelayMs: 30_000,
        }),
    ).toThrow("Base delay must be a positive integer.");
  });

  it("should reject a non-positive maximum delay", () => {
    expect(
      () =>
        new ExponentialBackoffStrategy({
          baseDelayMs: 1_000,
          maxDelayMs: 0,
        }),
    ).toThrow(
      "Maximum delay must be a positive integer.",
    );
  });

  it("should reject a maximum delay below the base delay", () => {
    expect(
      () =>
        new ExponentialBackoffStrategy({
          baseDelayMs: 5_000,
          maxDelayMs: 1_000,
        }),
    ).toThrow(
      "Maximum delay must be greater than or equal to the base delay.",
    );
  });
});