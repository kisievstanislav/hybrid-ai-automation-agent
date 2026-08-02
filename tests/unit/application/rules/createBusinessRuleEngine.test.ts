import { describe, expect, it } from 'vitest';
import { createBusinessRuleEngine } from '../../../../src/application/rules/index.js';
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
  id: 'TKT-1005',
  title: 'Login issue',
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

const aiClassification: AiClassificationResult = {
  category: TicketCategory.AUTHENTICATION,
  priority: TicketPriority.HIGH,
  recommendedTeam: SupportTeam.IDENTITY_SUPPORT,
  recommendedAction: 'Review account access.',
  confidence: 0.95,
  reasoningSummary: 'Authentication issue detected.',
  riskIndicators: [],
};

describe('createBusinessRuleEngine', () => {
  it('should create an engine with the default business rules', () => {
    const engine = createBusinessRuleEngine();

    const result = engine.evaluate(ticket, aiClassification);

    expect(result.decision).toBe(ProcessingDecision.AUTO_PROCESS);
  });
});
