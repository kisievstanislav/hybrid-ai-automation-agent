export interface BaseAppErrorOptions {
  code: string;
  message: string;
  retryable?: boolean;
  cause?: unknown;
}

export class BaseAppError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor({
    code,
    message,
    retryable = false,
    cause,
  }: BaseAppErrorOptions) {
    super(message);

    this.name = new.target.name;
    this.code = code;
    this.retryable = retryable;
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}