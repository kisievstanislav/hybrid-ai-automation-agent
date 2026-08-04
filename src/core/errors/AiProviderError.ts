import { BaseAppError } from './BaseAppError.js';

export interface AiProviderErrorOptions {
  retryable?: boolean;
  cause?: unknown;
}

export class AiProviderError extends BaseAppError {
  constructor(message: string, options: AiProviderErrorOptions = {}) {
    super({
      code: 'AI_PROVIDER_ERROR',
      message,
      cause: options.cause,
      retryable: options.retryable ?? true,
    });
  }
}
