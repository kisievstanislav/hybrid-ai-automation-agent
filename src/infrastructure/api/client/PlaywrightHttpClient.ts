import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Logger } from 'pino';

import type {
  HttpClient,
  HttpRequestOptions,
  HttpRequestWithBodyOptions,
  HttpResponse,
} from '../../../application/ports/api/HttpClient.js';
import { ApiError } from '../../../core/errors/ApiError.js';
import { logger } from '../../../core/logging/logger.js';

export class PlaywrightHttpClient implements HttpClient {
  constructor(
    private readonly requestContext: APIRequestContext,
    private readonly log: Logger = logger,
  ) {}

  async get<TData>(path: string, options: HttpRequestOptions = {}): Promise<HttpResponse<TData>> {
    return this.executeRequest<TData>('GET', path, options, () =>
      this.requestContext.get(path, {
        headers: this.buildHeaders(options),
        ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
      }),
    );
  }

  async post<TData, TBody>(
    path: string,
    options: HttpRequestWithBodyOptions<TBody>,
  ): Promise<HttpResponse<TData>> {
    return this.executeRequest<TData>('POST', path, options, () =>
      this.requestContext.post(path, {
        data: options.body,
        headers: this.buildHeaders(options),
        ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
      }),
    );
  }

  async patch<TData, TBody>(
    path: string,
    options: HttpRequestWithBodyOptions<TBody>,
  ): Promise<HttpResponse<TData>> {
    return this.executeRequest<TData>('PATCH', path, options, () =>
      this.requestContext.patch(path, {
        data: options.body,
        headers: this.buildHeaders(options),
        ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
      }),
    );
  }

  private async executeRequest<TData>(
    method: string,
    path: string,
    options: HttpRequestOptions,
    sendRequest: () => Promise<APIResponse>,
  ): Promise<HttpResponse<TData>> {
    const startedAt = Date.now();

    this.log.debug(
      {
        method,
        path,
        correlationId: options.correlationId,
      },
      'Sending API request',
    );

    try {
      const response = await sendRequest();

      if (!response.ok()) {
        throw new ApiError(
          `API request failed: ${method} ${path} returned ${response.status()} ${response.statusText()}`,
          {
            retryable: this.isRetryableStatus(response.status()),
          },
        );
      }

      const data = (await response.json()) as TData;

      this.log.debug(
        {
          method,
          path,
          status: response.status(),
          durationMs: Date.now() - startedAt,
          correlationId: options.correlationId,
        },
        'API request completed',
      );

      return {
        status: response.status(),
        headers: response.headers(),
        data,
      };
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(`API request could not be completed: ${method} ${path}`, {
        retryable: true,
        cause: error,
      });
    }
  }

  private buildHeaders(options: HttpRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (options.correlationId) {
      headers['x-correlation-id'] = options.correlationId;
    }

    return headers;
  }

  private isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
  }
}
