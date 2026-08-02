import type {
  AiClassificationResult,
  Ticket,
  TicketProcessingDecision,
} from '../../domain/ticket/index.js';
import { ProcessingDecision } from '../../domain/ticket/index.js';
import type { BusinessRule } from './BusinessRule.js';

export class BusinessRuleEngine {
  constructor(private readonly rules: readonly BusinessRule[]) {}

  evaluate(ticket: Ticket, aiClassification: AiClassificationResult): TicketProcessingDecision {
    const results = this.rules.map((rule) => rule.evaluate(ticket, aiClassification));

    const humanReviewResult = results.find(
      (result) => !result.passed && result.requiresHumanReview,
    );

    if (humanReviewResult) {
      return {
        ticketId: ticket.id,
        decision: ProcessingDecision.HUMAN_REVIEW,
        approvedCategory: null,
        approvedPriority: null,
        approvedTeam: null,
        confidence: aiClassification.confidence,
        reason: humanReviewResult.reason,
      };
    }

    const rejectedResult = results.find((result) => !result.passed);

    if (rejectedResult) {
      return {
        ticketId: ticket.id,
        decision: ProcessingDecision.REJECTED,
        approvedCategory: null,
        approvedPriority: null,
        approvedTeam: null,
        confidence: aiClassification.confidence,
        reason: rejectedResult.reason,
      };
    }

    return {
      ticketId: ticket.id,
      decision: ProcessingDecision.AUTO_PROCESS,
      approvedCategory: aiClassification.category,
      approvedPriority: aiClassification.priority,
      approvedTeam: aiClassification.recommendedTeam,
      confidence: aiClassification.confidence,
      reason: 'All business rules approved the AI recommendation.',
    };
  }
}
