import { z } from 'zod';

export const ollamaGenerateResponseSchema = z.object({
  response: z.string().min(1),
  done: z.boolean(),
});

export type OllamaGenerateResponse = z.infer<typeof ollamaGenerateResponseSchema>;
