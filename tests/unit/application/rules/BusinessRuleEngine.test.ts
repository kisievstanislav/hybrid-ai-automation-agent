import { describe, expect, it } from 'vitest';
import { BusinessRuleEngine, type BusinessRule } from '../../../../src/application/rules/index.js';
import {
  CustomerType,
  ProcessingDecision,
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
  description: 'Customer cannot access the account.',
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

const aiClassification: AiClassificationResult = {
  category: TicketCategory.AUTHENTICATION,
  priority: TicketPriority.HIGH,
  recommendedTeam: SupportTeam.IDENTITY_SUPPORT,
  recommendedAction: 'Review account access.',
  confidence: 0.95,
  reasoningSummary: 'Authentication problem detected.',
  riskIndicators: [],
};

describe('BusinessRuleEngine', () => {
  it('should return AUTO_PROCESS when all rules pass', () => {
    const passingRule: BusinessRule = {
      name: 'PassingRule',
      evaluate: () => ({
        passed: true,
        requiresHumanReview: false,
        reason: 'Rule passed.',
      }),
    };

    const engine = new BusinessRuleEngine([passingRule]);

    const result = engine.evaluate(ticket, aiClassification);

    expect(result.decision).toBe(ProcessingDecision.AUTO_PROCESS);
    expect(result.approvedCategory).toBe(TicketCategory.AUTHENTICATION);
    expect(result.approvedPriority).toBe(TicketPriority.HIGH);
    expect(result.approvedTeam).toBe(SupportTeam.IDENTITY_SUPPORT);
  });

  it('should return HUMAN_REVIEW when a rule requires review', () => {
    const reviewRule: BusinessRule = {
      name: 'ReviewRule',
      evaluate: () => ({
        passed: false,
        requiresHumanReview: true,
        reason: 'Manual review is required.',
      }),
    };

    const engine = new BusinessRuleEngine([reviewRule]);

    const result = engine.evaluate(ticket, aiClassification);

    expect(result.decision).toBe(ProcessingDecision.HUMAN_REVIEW);
    expect(result.approvedCategory).toBeNull();
    expect(result.reason).toBe('Manual review is required.');
  });

  it('should return REJECTED when a rule fails without human review', () => {
    const rejectingRule: BusinessRule = {
      name: 'RejectingRule',
      evaluate: () => ({
        passed: false,
        requiresHumanReview: false,
        reason: 'Ticket cannot be processed.',
      }),
    };

    const engine = new BusinessRuleEngine([rejectingRule]);

    const result = engine.evaluate(ticket, aiClassification);

    expect(result.decision).toBe(ProcessingDecision.REJECTED);
    expect(result.approvedCategory).toBeNull();
    expect(result.reason).toBe('Ticket cannot be processed.');
  });
});
