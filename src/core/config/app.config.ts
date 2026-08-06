import { environment } from './environment.js';

export const appConfig = {
  environment: environment.NODE_ENV,

  app: {
    baseUrl: environment.APP_BASE_URL,
  },

  api: {
    baseUrl: environment.API_BASE_URL,
  },

  database: {
    url: environment.DATABASE_URL,
  },

  ai: {
    provider: environment.AI_PROVIDER,

    openAiApiKey: environment.OPENAI_API_KEY,
    openAiModel: environment.OPENAI_MODEL,
    openAiTimeoutMs: environment.OPENAI_TIMEOUT_MS,

    ollamaBaseUrl: environment.OLLAMA_BASE_URL,
    ollamaModel: environment.OLLAMA_MODEL,
    ollamaTimeoutMs: environment.OLLAMA_TIMEOUT_MS,

    confidenceThreshold: environment.AI_CONFIDENCE_THRESHOLD,
  },

  retry: {
    maxAttempts: environment.MAX_RETRY_ATTEMPTS,
  },

  queueWorker: {
    workerId: environment.WORKER_ID,
    pollIntervalMs: environment.QUEUE_POLL_INTERVAL_MS,
    retryBaseDelayMs: environment.QUEUE_RETRY_BASE_DELAY_MS,
    retryMaxDelayMs: environment.QUEUE_RETRY_MAX_DELAY_MS,
    concurrency: environment.QUEUE_CONCURRENCY,
  },

  logging: {
    level: environment.LOG_LEVEL,
  },

  browser: {
    headless: environment.HEADLESS,
  },
} as const;

export type AppConfig = typeof appConfig;
export type QueueWorkerConfig = typeof appConfig.queueWorker;
