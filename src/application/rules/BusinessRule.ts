import type { AiClassificationResult, Ticket } from '../../domain/ticket/index.js';

export interface BusinessRuleResult {
  readonly passed: boolean;
  readonly requiresHumanReview: boolean;
  readonly reason: string;
}

export interface BusinessRule {
  readonly name: string;

  evaluate(ticket: Ticket, aiClassification: AiClassificationResult): BusinessRuleResult;
}
