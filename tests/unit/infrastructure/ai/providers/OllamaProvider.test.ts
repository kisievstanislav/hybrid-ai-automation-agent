import { afterEach, describe, expect, it, vi } from 'vitest';

import { CustomerType } from '../../../../../src/domain/ticket/CustomerType.js';
import type { Ticket } from '../../../../../src/domain/ticket/Ticket.js';
import { TicketStatus } from '../../../../../src/domain/ticket/TicketStatus.js';
import { OllamaProvider } from '../../../../../src/infrastructure/ai/providers/OllamaProvider.js';

describe('OllamaProvider', () => {
  const createTicket = (): Ticket => ({
    id: 'TKT-1001',
    title: 'Unable to log in',
    description: 'The customer reset the password but still cannot log in.',
    customerType: CustomerType.PREMIUM,
    status: TicketStatus.NEW,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: [],
    previousAttempts: 0,
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
  });

  const createProvider = (): OllamaProvider =>
    new OllamaProvider(
      'http://localhost:11434',
      'qwen2.5:3b',
      60_000,
    );

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return a valid structured classification', async () => {
    const classification = {
      category: 'AUTHENTICATION',
      priority: 'HIGH',
      recommendedTeam: 'IDENTITY_SUPPORT',
      recommendedAction: 'Review authentication logs',
      confidence: 0.94,
      reasoningSummary: 'The ticket describes a login problem.',
      riskIndicators: [],
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: JSON.stringify(classification),
          done: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await createProvider().classifyTicket(createTicket());

    expect(result.category).toBe('AUTHENTICATION');
    expect(result.priority).toBe('HIGH');
    expect(result.recommendedTeam).toBe('IDENTITY_SUPPORT');
    expect(result.confidence).toBe(0.94);

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      }),
    );

    const requestOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse(requestOptions.body as string) as {
      model: string;
      stream: boolean;
      format: string;
      prompt: string;
    };

    expect(requestBody.model).toBe('qwen2.5:3b');
    expect(requestBody.stream).toBe(false);
    expect(requestBody.format).toBe('json');
    expect(requestBody.prompt).toContain('Unable to log in');
  });

  it('should throw when Ollama returns an invalid classification', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: JSON.stringify({
            category: 'AUTHENTICATION',
          }),
          done: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createProvider().classifyTicket(createTicket()),
    ).rejects.toThrow(
      'Ollama returned an invalid ticket classification.',
    );
  });

  it('should throw when Ollama returns invalid JSON text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: 'not-valid-json',
          done: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createProvider().classifyTicket(createTicket()),
    ).rejects.toThrow(
      'Ollama returned invalid JSON classification text.',
    );
  });

  it('should throw when Ollama returns an invalid API response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          done: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createProvider().classifyTicket(createTicket()),
    ).rejects.toThrow(
      'Ollama returned an invalid API response.',
    );
  });

  it('should throw AiProviderError when the Ollama request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new Error('Ollama connection failed'));

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createProvider().classifyTicket(createTicket()),
    ).rejects.toThrow(
      'Ollama ticket classification failed.',
    );
  });

  it('should throw when Ollama returns a server error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('Internal Server Error', {
        status: 500,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createProvider().classifyTicket(createTicket()),
    ).rejects.toThrow(
      'Ollama returned HTTP status 500.',
    );
  });

  it('should throw when Ollama returns a client error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('Model not found', {
        status: 404,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createProvider().classifyTicket(createTicket()),
    ).rejects.toThrow(
      'Ollama returned HTTP status 404.',
    );
  });
});