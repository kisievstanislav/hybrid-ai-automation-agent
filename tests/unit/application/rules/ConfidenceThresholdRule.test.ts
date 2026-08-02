import { describe, expect, it } from 'vitest';
import { ConfidenceThresholdRule } from '../../../../src/application/rules/index.js';
import {
  CustomerType,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type AiClassificationResult,
  type Ticket,
} from '../../../../src/domain/index.js';

const ticket: Ticket = {
  id: 'TKT-1001',
  title: 'Login problem',
  description: 'Customer cannot log in.',
  customerType: CustomerType.STANDARD,
  status: TicketStatus.NEW,
  priority: null,
  category: null,
  assignedTeam: null,
  tags: [],
  previousAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createAiResult = (confidence: number): AiClassificationResult => ({
  category: TicketCategory.AUTHENTICATION,
  priority: TicketPriority.HIGH,
  recommendedTeam: SupportTeam.IDENTITY_SUPPORT,
  recommendedAction: 'Review account access.',
  confidence,
  reasoningSummary: 'Authentication problem detected.',
  riskIndicators: [],
});

describe('ConfidenceThresholdRule', () => {
  const rule = new ConfidenceThresholdRule(0.8);

  it('should pass when confidence equals the threshold', () => {
    const result = rule.evaluate(ticket, createAiResult(0.8));

    expect(result.passed).toBe(true);
    expect(result.requiresHumanReview).toBe(false);
  });

  it('should require human review when confidence is below the threshold', () => {
    const result = rule.evaluate(ticket, createAiResult(0.79));

    expect(result.passed).toBe(false);
    expect(result.requiresHumanReview).toBe(true);
  });
});