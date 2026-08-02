import type { AiClassificationResult, Ticket } from '../../domain/ticket/index.js';
import type { BusinessRule, BusinessRuleResult } from './BusinessRule.js';

export class ConfidenceThresholdRule implements BusinessRule {
  readonly name = 'ConfidenceThresholdRule';

  constructor(private readonly minimumConfidence: number) {}

  evaluate(_ticket: Ticket, aiClassification: AiClassificationResult): BusinessRuleResult {
    if (aiClassification.confidence < this.minimumConfidence) {
      return {
        passed: false,
        requiresHumanReview: true,
        reason: `AI confidence ${aiClassification.confidence} is below the minimum threshold ${this.minimumConfidence}.`,
      };
    }

    return {
      passed: true,
      requiresHumanReview: false,
      reason: 'AI confidence meets the minimum threshold.',
    };
  }
}
