import { describe, expect, it } from 'vitest';
import { SecurityPriorityRule } from '../../../../src/application/rules/index.js';
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
  id: 'TKT-1002',
  title: 'Suspicious account activity',
  description: 'Customer reports suspicious activity.',
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

const createAiResult = (
  priority: TicketPriority,
): AiClassificationResult => ({
  category: TicketCategory.SECURITY,
  priority,
  recommendedTeam: SupportTeam.SECURITY_OPERATIONS,
  recommendedAction: 'Investigate suspicious activity.',
  confidence: 0.95,
  reasoningSummary: 'Possible security incident.',
  riskIndicators: ['SUSPICIOUS_ACTIVITY'],
});

describe('SecurityPriorityRule', () => {
  const rule = new SecurityPriorityRule();

  it('should pass when security priority is HIGH', () => {
    const result = rule.evaluate(
      ticket,
      createAiResult(TicketPriority.HIGH),
    );

    expect(result.passed).toBe(true);
  });

  it('should pass when security priority is CRITICAL', () => {
    const result = rule.evaluate(
      ticket,
      createAiResult(TicketPriority.CRITICAL),
    );

    expect(result.passed).toBe(true);
  });

  it('should require human review when security priority is MEDIUM', () => {
    const result = rule.evaluate(
      ticket,
      createAiResult(TicketPriority.MEDIUM),
    );

    expect(result.passed).toBe(false);
    expect(result.requiresHumanReview).toBe(true);
  });
});