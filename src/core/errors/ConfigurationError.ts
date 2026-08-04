import { BaseAppError } from './BaseAppError.js';

export interface ConfigurationErrorOptions {
  cause?: unknown;
}

export class ConfigurationError extends BaseAppError {
  constructor(message: string, options: ConfigurationErrorOptions = {}) {
    super({
      code: 'CONFIGURATION_ERROR',
      message,
      cause: options.cause,
      retryable: false,
    });
  }
}
