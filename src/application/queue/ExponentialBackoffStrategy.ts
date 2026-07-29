import type { RetryStrategy } from "./RetryStrategy.js";

export interface ExponentialBackoffOptions {
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export class ExponentialBackoffStrategy
  implements RetryStrategy
{
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: ExponentialBackoffOptions) {
    this.validateOptions(options);

    this.baseDelayMs = options.baseDelayMs;
    this.maxDelayMs = options.maxDelayMs;
  }

  calculateDelayMs(attemptNumber: number): number {
    if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
      throw new RangeError(
        "Attempt number must be a positive integer.",
      );
    }

    const exponentialDelay =
      this.baseDelayMs * 2 ** (attemptNumber - 1);

    return Math.min(exponentialDelay, this.maxDelayMs);
  }

  private validateOptions(
    options: ExponentialBackoffOptions,
  ): void {
    if (
      !Number.isInteger(options.baseDelayMs) ||
      options.baseDelayMs <= 0
    ) {
      throw new RangeError(
        "Base delay must be a positive integer.",
      );
    }

    if (
      !Number.isInteger(options.maxDelayMs) ||
      options.maxDelayMs <= 0
    ) {
      throw new RangeError(
        "Maximum delay must be a positive integer.",
      );
    }

    if (options.maxDelayMs < options.baseDelayMs) {
      throw new RangeError(
        "Maximum delay must be greater than or equal to the base delay.",
      );
    }
  }
}