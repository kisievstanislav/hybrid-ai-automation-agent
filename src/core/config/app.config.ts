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
    ollamaBaseUrl: environment.OLLAMA_BASE_URL,
    confidenceThreshold: environment.AI_CONFIDENCE_THRESHOLD,
  },

  retry: {
    maxAttempts: environment.MAX_RETRY_ATTEMPTS,
  },

  logging: {
    level: environment.LOG_LEVEL,
  },

  browser: {
    headless: environment.HEADLESS,
  },
} as const;

export type AppConfig = typeof appConfig;