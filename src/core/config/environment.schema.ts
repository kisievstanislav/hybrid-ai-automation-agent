import { z } from 'zod';

const booleanSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  APP_BASE_URL: z.url(),
  API_BASE_URL: z.url(),
  DATABASE_URL: z.string().min(1),

  AI_PROVIDER: z.enum(['mock', 'openai', 'ollama']).default('mock'),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  OLLAMA_BASE_URL: z.url().optional(),

  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),

  MAX_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(10).default(3),

  WORKER_ID: z.string().trim().min(1).default('local-worker-1'),

  QUEUE_POLL_INTERVAL_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),

  QUEUE_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(100).max(300_000).default(1_000),

  QUEUE_RETRY_MAX_DELAY_MS: z.coerce.number().int().min(100).max(900_000).default(30_000),

  QUEUE_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(1),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  HEADLESS: booleanSchema.default(true),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;
