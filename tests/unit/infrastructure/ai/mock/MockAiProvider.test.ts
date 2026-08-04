import { describe, it, expect } from 'vitest';
import { CustomerType } from '../../../../../src/domain/ticket/CustomerType.js';
import type { Ticket } from '../../../../../src/domain/ticket/Ticket.js';
import { TicketStatus } from '../../../../../src/domain/ticket/TicketStatus.js';
import { MockAiProvider } from '../../../../../src/infrastructure/ai/mock/MockAiProvider.js';
import { aiClassificationSchema } from '../../../../../src/infrastructure/ai/schemas/aiClassification.schema.js';

describe('MockAiProvider', () => {
  const provider = new MockAiProvider();

  const createTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
    id: 'TKT-1001',
    title: 'General support request',
    description: 'Customer needs assistance.',
    customerType: CustomerType.STANDARD,
    status: TicketStatus.NEW,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: [],
    previousAttempts: 0,
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
    ...overrides,
  });

  it('should classify a login problem as authentication', async () => {
    const ticket = createTicket({
      title: 'Unable to log in',
      description: 'The customer reset the password but still cannot log in.',
    });

    const result = await provider.classifyTicket(ticket);

    expect(result).toEqual({
      category: 'AUTHENTICATION',
      priority: 'HIGH',
      recommendedTeam: 'IDENTITY_SUPPORT',
      recommendedAction: 'Review account access and authentication logs',
      confidence: 0.94,
      reasoningSummary: 'The ticket describes an account authentication problem.',
      riskIndicators: [],
    });
  });

  it('should prioritize security over account classification', async () => {
    const ticket = createTicket({
      title: 'Account may be hacked',
      description: 'The customer believes someone accessed the account.',
    });

    const result = await provider.classifyTicket(ticket);

    expect(result.category).toBe('SECURITY');
    expect(result.priority).toBe('CRITICAL');
    expect(result.recommendedTeam).toBe('SECURITY_OPERATIONS');
    expect(result.riskIndicators).toContain('POTENTIAL_SECURITY_INCIDENT');
  });

  it('should classify a billing problem', async () => {
    const ticket = createTicket({
      title: 'Incorrect invoice',
      description: 'The customer was charged twice for the same payment.',
    });

    const result = await provider.classifyTicket(ticket);

    expect(result.category).toBe('BILLING');
    expect(result.priority).toBe('MEDIUM');
    expect(result.recommendedTeam).toBe('BILLING_SUPPORT');
    expect(result.confidence).toBe(0.92);
  });

  it('should classify a technical problem', async () => {
    const ticket = createTicket({
      title: 'Application crash',
      description: 'The application displays an error and is not working.',
    });

    const result = await provider.classifyTicket(ticket);

    expect(result.category).toBe('TECHNICAL');
    expect(result.priority).toBe('MEDIUM');
    expect(result.recommendedTeam).toBe('TECHNICAL_SUPPORT');
    expect(result.confidence).toBe(0.9);
  });

  it('should classify an account request', async () => {
    const ticket = createTicket({
      title: 'Update profile',
      description: 'The customer wants to change the email address.',
    });

    const result = await provider.classifyTicket(ticket);

    expect(result.category).toBe('ACCOUNT');
    expect(result.priority).toBe('LOW');
    expect(result.recommendedTeam).toBe('ACCOUNT_SUPPORT');
    expect(result.confidence).toBe(0.88);
  });

  it('should return low confidence for an unclear ticket', async () => {
    const ticket = createTicket({
      title: 'Customer question',
      description: 'The customer would like more information.',
    });

    const result = await provider.classifyTicket(ticket);

    expect(result.category).toBe('OTHER');
    expect(result.priority).toBe('LOW');
    expect(result.confidence).toBe(0.6);
    expect(result.riskIndicators).toContain('UNCLEAR_CLASSIFICATION');
  });

  it('should return a response that passes Zod validation', async () => {
    const ticket = createTicket({
      title: 'Incorrect invoice',
      description: 'The customer was charged twice for the same payment.',
    });

    const result = await provider.classifyTicket(ticket);

    const validationResult = aiClassificationSchema.safeParse(result);

    expect(validationResult.success).toBe(true);
  });

  it('should return the same result for the same ticket', async () => {
    const ticket = createTicket({
      title: 'Unable to log in',
      description: 'The customer reset the password but still cannot log in.',
    });

    const firstResult = await provider.classifyTicket(ticket);
    const secondResult = await provider.classifyTicket(ticket);

    expect(secondResult).toEqual(firstResult);
  });
});
