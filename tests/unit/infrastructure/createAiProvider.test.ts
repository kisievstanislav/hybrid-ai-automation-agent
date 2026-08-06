import { afterEach, describe, expect, it, vi } from 'vitest';

describe('createAiProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('should create MockAiProvider when AI_PROVIDER is mock', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('DATABASE_URL', 'file:./test.db');
    vi.stubEnv('AI_PROVIDER', 'mock');

    const { createAiProvider } = await import('../../../src/infrastructure/ai/createAiProvider.js');

    const { MockAiProvider } =
      await import('../../../src/infrastructure/ai/mock/MockAiProvider.js');

    const provider = createAiProvider();

    expect(provider).toBeInstanceOf(MockAiProvider);
  });

  it('should throw when OpenAI is selected without an API key', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('DATABASE_URL', 'file:./test.db');
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', '');

    const { createAiProvider } = await import('../../../src/infrastructure/ai/createAiProvider.js');

    expect(() => createAiProvider()).toThrow(
      'OPENAI_API_KEY is required when AI_PROVIDER is openai.',
    );
  });

  it('should create OpenAiProvider when OpenAI is selected', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('DATABASE_URL', 'file:./test.db');
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key');
    vi.stubEnv('OPENAI_MODEL', 'gpt-5-mini');
    vi.stubEnv('OPENAI_TIMEOUT_MS', '30000');

    const { createAiProvider } = await import('../../../src/infrastructure/ai/createAiProvider.js');

    const { OpenAiProvider } =
      await import('../../../src/infrastructure/ai/providers/OpenAiProvider.js');

    const provider = createAiProvider();

    expect(provider).toBeInstanceOf(OpenAiProvider);
  });

  it('should create OllamaProvider when Ollama provider is selected', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('DATABASE_URL', 'file:./test.db');
    vi.stubEnv('AI_PROVIDER', 'ollama');
    vi.stubEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
    vi.stubEnv('OLLAMA_MODEL', 'qwen2.5:3b');
    vi.stubEnv('OLLAMA_TIMEOUT_MS', '60000');

    const { createAiProvider } = await import('../../../src/infrastructure/ai/createAiProvider.js');

    const { OllamaProvider } =
      await import('../../../src/infrastructure/ai/providers/OllamaProvider.js');

    const provider = createAiProvider();

    expect(provider).toBeInstanceOf(OllamaProvider);
  });
});
