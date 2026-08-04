import OpenAI from 'openai';

import type { AiProvider } from '../../application/ports/ai/AiProvider.js';
import { appConfig } from '../../core/config/app.config.js';
import { ConfigurationError } from '../../core/errors/ConfigurationError.js';
import { MockAiProvider } from './mock/MockAiProvider.js';
import { OpenAiProvider } from './providers/OpenAiProvider.js';

export function createAiProvider(): AiProvider {
  switch (appConfig.ai.provider) {
    case 'mock':
      return new MockAiProvider();

    case 'openai': {
      if (!appConfig.ai.openAiApiKey) {
        throw new ConfigurationError('OPENAI_API_KEY is required when AI_PROVIDER is openai.');
      }

      const client = new OpenAI({
        apiKey: appConfig.ai.openAiApiKey,
        timeout: appConfig.ai.openAiTimeoutMs,
      });

      return new OpenAiProvider(client, appConfig.ai.openAiModel);
    }

    case 'ollama':
      throw new ConfigurationError('Ollama provider is not implemented yet.');
  }
}
