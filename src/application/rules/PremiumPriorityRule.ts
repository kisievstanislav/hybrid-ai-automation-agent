import type { AiClassificationResult, Ticket } from '../../domain/ticket/index.js';
import { CustomerType, TicketPriority } from '../../domain/ticket/index.js';
import type { BusinessRule, BusinessRuleResult } from './BusinessRule.js';

export class PremiumPriorityRule implements BusinessRule {
  readonly name = 'PremiumPriorityRule';

  evaluate(ticket: Ticket, aiClassification: AiClassificationResult): BusinessRuleResult {
    const isPremiumCustomer = ticket.customerType === CustomerType.PREMIUM;

    const hasLowPriority = aiClassification.priority === TicketPriority.LOW;

    if (isPremiumCustomer && hasLowPriority) {
      return {
        passed: false,
        requiresHumanReview: true,
        reason: 'Premium customers must have at least MEDIUM priority.',
      };
    }

    return {
      passed: true,
      requiresHumanReview: false,
      reason: 'Premium customer priority rule passed.',
    };
  }
}
