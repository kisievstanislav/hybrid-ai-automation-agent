import type { AiClassificationResult, Ticket } from '../../domain/ticket/index.js';
import { TicketCategory, TicketPriority } from '../../domain/ticket/index.js';
import type { BusinessRule, BusinessRuleResult } from './BusinessRule.js';

export class SecurityPriorityRule implements BusinessRule {
  readonly name = 'SecurityPriorityRule';

  evaluate(_ticket: Ticket, aiClassification: AiClassificationResult): BusinessRuleResult {
    const isSecurity = aiClassification.category === TicketCategory.SECURITY;

    const validPriority =
      aiClassification.priority === TicketPriority.HIGH ||
      aiClassification.priority === TicketPriority.CRITICAL;

    if (isSecurity && !validPriority) {
      return {
        passed: false,
        requiresHumanReview: true,
        reason: 'Security tickets must have HIGH or CRITICAL priority.',
      };
    }

    return {
      passed: true,
      requiresHumanReview: false,
      reason: 'Security priority rule passed.',
    };
  }
}
