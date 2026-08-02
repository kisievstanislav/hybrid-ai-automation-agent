import { appConfig } from '../../core/config/app.config.js';
import { AlreadyProcessedRule } from './AlreadyProcessedRule.js';
import { BusinessRuleEngine } from './BusinessRuleEngine.js';
import { ConfidenceThresholdRule } from './ConfidenceThresholdRule.js';
import { PremiumPriorityRule } from './PremiumPriorityRule.js';
import { SecurityPriorityRule } from './SecurityPriorityRule.js';

export function createBusinessRuleEngine(): BusinessRuleEngine {
  return new BusinessRuleEngine([
    new AlreadyProcessedRule(),
    new ConfidenceThresholdRule(appConfig.ai.confidenceThreshold),
    new SecurityPriorityRule(),
    new PremiumPriorityRule(),
  ]);
}
