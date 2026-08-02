import { describe, expect, it } from 'vitest';
import { PremiumPriorityRule } from '../../../../src/application/rules/index.js';
import {
  CustomerType,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type AiClassificationResult,
  type Ticket,
} from '../../../../src/domain/index.js';

const createTicket = (customerType: CustomerType): Ticket => ({
  id: 'TKT-1003',
  title: 'Billing issue',
  description: 'Customer has a billing question.',
  customerType,
  status: TicketStatus.NEW,
  priority: null,
  category: null,
  assignedTeam: null,
  tags: [],
  previousAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createAiResult = (
  priority: TicketPriority,
): AiClassificationResult => ({
  category: TicketCategory.BILLING,
  priority,
  recommendedTeam: SupportTeam.BILLING_SUPPORT,
  recommendedAction: 'Review the billing account.',
  confidence: 0.9,
  reasoningSummary: 'Billing issue detected.',
  riskIndicators: [],
});

describe('PremiumPriorityRule', () => {
  const rule = new PremiumPriorityRule();

  it('should pass when premium customer priority is MEDIUM', () => {
    const result = rule.evaluate(
      createTicket(CustomerType.PREMIUM),
      createAiResult(TicketPriority.MEDIUM),
    );

    expect(result.passed).toBe(true);
  });

  it('should require human review when premium customer priority is LOW', () => {
    const result = rule.evaluate(
      createTicket(CustomerType.PREMIUM),
      createAiResult(TicketPriority.LOW),
    );

    expect(result.passed).toBe(false);
    expect(result.requiresHumanReview).toBe(true);
  });

  it('should allow LOW priority for a standard customer', () => {
    const result = rule.evaluate(
      createTicket(CustomerType.STANDARD),
      createAiResult(TicketPriority.LOW),
    );

    expect(result.passed).toBe(true);
  });
});