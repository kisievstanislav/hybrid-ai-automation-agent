import { describe, expect, it } from 'vitest';
import { AlreadyProcessedRule } from '../../../../src/application/rules/index.js';
import {
  CustomerType,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type AiClassificationResult,
  type Ticket,
} from '../../../../src/domain/index.js';

const createTicket = (status: TicketStatus): Ticket => ({
  id: 'TKT-1004',
  title: 'Account update',
  description: 'Customer needs an account update.',
  customerType: CustomerType.STANDARD,
  status,
  priority: null,
  category: null,
  assignedTeam: null,
  tags: [],
  previousAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const aiClassification: AiClassificationResult = {
  category: TicketCategory.ACCOUNT,
  priority: TicketPriority.MEDIUM,
  recommendedTeam: SupportTeam.ACCOUNT_SUPPORT,
  recommendedAction: 'Review the customer account.',
  confidence: 0.9,
  reasoningSummary: 'Account support is required.',
  riskIndicators: [],
};

describe('AlreadyProcessedRule', () => {
  const rule = new AlreadyProcessedRule();

  it('should pass when ticket status is NEW', () => {
    const result = rule.evaluate(
      createTicket(TicketStatus.NEW),
      aiClassification,
    );

    expect(result.passed).toBe(true);
  });

  it('should reject a RESOLVED ticket', () => {
    const result = rule.evaluate(
      createTicket(TicketStatus.RESOLVED),
      aiClassification,
    );

    expect(result.passed).toBe(false);
    expect(result.requiresHumanReview).toBe(false);
  });

  it('should reject a CLOSED ticket', () => {
    const result = rule.evaluate(
      createTicket(TicketStatus.CLOSED),
      aiClassification,
    );

    expect(result.passed).toBe(false);
    expect(result.requiresHumanReview).toBe(false);
  });
});