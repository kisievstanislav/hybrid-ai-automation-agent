import type { AiClassificationResult, Ticket } from '../../domain/ticket/index.js';
import { TicketStatus } from '../../domain/ticket/index.js';
import type { BusinessRule, BusinessRuleResult } from './BusinessRule.js';

export class AlreadyProcessedRule implements BusinessRule {
  readonly name = 'AlreadyProcessedRule';

  evaluate(ticket: Ticket, _aiClassification: AiClassificationResult): BusinessRuleResult {
    const isAlreadyProcessed =
      ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED;

    if (isAlreadyProcessed) {
      return {
        passed: false,
        requiresHumanReview: false,
        reason: `Ticket is already ${ticket.status} and cannot be processed again.`,
      };
    }

    return {
      passed: true,
      requiresHumanReview: false,
      reason: 'Ticket has not already been processed.',
    };
  }
}
