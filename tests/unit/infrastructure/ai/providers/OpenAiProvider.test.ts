import OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';

import { CustomerType } from '../../../../../src/domain/ticket/CustomerType.js';
import type { Ticket } from '../../../../../src/domain/ticket/Ticket.js';
import { TicketStatus } from '../../../../../src/domain/ticket/TicketStatus.js';
import { OpenAiProvider } from '../../../../../src/infrastructure/ai/providers/OpenAiProvider.js';

describe('OpenAiProvider', () => {
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

  it('should return a valid structured classification', async () => {
    const parseMock = vi.fn().mockResolvedValue({
      output_parsed: {
        category: 'AUTHENTICATION',
        priority: 'HIGH',
        recommendedTeam: 'IDENTITY_SUPPORT',
        recommendedAction: 'Review authentication logs',
        confidence: 0.94,
        reasoningSummary: 'The ticket describes a login problem.',
        riskIndicators: [],
      },
    });

    const client = {
      responses: {
        parse: parseMock,
      },
    } as unknown as OpenAI;

    const provider = new OpenAiProvider(client, 'gpt-5-mini');

    const result = await provider.classifyTicket(createTicket());

    expect(result.category).toBe('AUTHENTICATION');
    expect(result.priority).toBe('HIGH');
    expect(result.recommendedTeam).toBe('IDENTITY_SUPPORT');
    expect(result.confidence).toBe(0.94);

    expect(parseMock).toHaveBeenCalledOnce();

    expect(parseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-mini',
      }),
    );
  });

  it('should throw when OpenAI returns an invalid classification', async () => {
    const parseMock = vi.fn().mockResolvedValue({
      output_parsed: {
        category: 'AUTHENTICATION',
        // Missing required fields
      },
    });

    const client = {
      responses: {
        parse: parseMock,
      },
    } as unknown as OpenAI;

    const provider = new OpenAiProvider(client, 'gpt-5-mini');

    await expect(provider.classifyTicket(createTicket())).rejects.toThrow(
      'OpenAI returned an invalid ticket classification.',
    );
  });

  it('should throw AiProviderError when the OpenAI request fails', async () => {
    const parseMock = vi.fn().mockRejectedValue(new Error('OpenAI timeout'));

    const client = {
      responses: {
        parse: parseMock,
      },
    } as unknown as OpenAI;

    const provider = new OpenAiProvider(client, 'gpt-5-mini');

    await expect(provider.classifyTicket(createTicket())).rejects.toThrow(
      'OpenAI ticket classification failed.',
    );
  });

  it('should throw when OpenAI returns no classification', async () => {
    const parseMock = vi.fn().mockResolvedValue({
      output_parsed: null,
    });

    const client = {
      responses: {
        parse: parseMock,
      },
    } as unknown as OpenAI;

    const provider = new OpenAiProvider(client, 'gpt-5-mini');

    await expect(provider.classifyTicket(createTicket())).rejects.toThrow(
      'OpenAI returned no valid ticket classification.',
    );
  });
});
