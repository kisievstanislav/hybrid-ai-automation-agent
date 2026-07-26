import { z } from 'zod';

const booleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  APP_BASE_URL: z.url(),
  API_BASE_URL: z.url(),
  DATABASE_URL: z.string().min(1),

  AI_PROVIDER: z.enum(['mock', 'openai', 'ollama']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.url().optional(),

  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),
  MAX_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(10).default(3),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  HEADLESS: booleanSchema.default(true),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;