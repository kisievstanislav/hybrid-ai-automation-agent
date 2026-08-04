import type { AiClassificationResult as AiProviderResult } from '../ports/ai/AiProvider.js';

import {
  SupportTeam,
  TicketCategory,
  TicketPriority,
  type AiClassificationResult as DomainAiResult,
} from '../../domain/ticket/index.js';

const teamMap: Readonly<Record<string, SupportTeam>> = {
  IDENTITY_SUPPORT: SupportTeam.IDENTITY_SUPPORT,
  BILLING_SUPPORT: SupportTeam.BILLING_SUPPORT,
  TECHNICAL_SUPPORT: SupportTeam.TECHNICAL_SUPPORT,
  ACCOUNT_SUPPORT: SupportTeam.ACCOUNT_SUPPORT,
  SECURITY_OPERATIONS: SupportTeam.SECURITY_OPERATIONS,
  GENERAL_SUPPORT: SupportTeam.GENERAL_SUPPORT,
};

export function mapAiClassification(result: AiProviderResult): DomainAiResult {
  const recommendedTeam = teamMap[result.recommendedTeam];

  if (!recommendedTeam) {
    throw new Error(`Unsupported AI recommended team: ${result.recommendedTeam}`);
  }

  return {
    category: TicketCategory[result.category],
    priority: TicketPriority[result.priority],
    recommendedTeam,
    recommendedAction: result.recommendedAction,
    confidence: result.confidence,
    reasoningSummary: result.reasoningSummary,
    riskIndicators: result.riskIndicators,
  };
}
