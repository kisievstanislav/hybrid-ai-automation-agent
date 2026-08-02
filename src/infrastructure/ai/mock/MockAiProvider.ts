import type {
  AiClassificationResult,
  AiProvider,
} from '../../../application/ports/ai/AiProvider.js';
import type { Ticket } from '../../../domain/ticket/Ticket.js';
import { aiClassificationSchema } from '../schemas/aiClassification.schema.js';

export class MockAiProvider implements AiProvider {
  async classifyTicket(ticket: Ticket): Promise<AiClassificationResult> {
    const ticketText = `${ticket.title} ${ticket.description}`.toLowerCase();

    const classification = this.createClassification(ticketText);

    return aiClassificationSchema.parse(classification);
  }

  private createClassification(ticketText: string): AiClassificationResult {
    if (this.containsAny(ticketText, ['security', 'fraud', 'breach', 'hacked'])) {
      return {
        category: 'SECURITY',
        priority: 'CRITICAL',
        recommendedTeam: 'SECURITY_OPERATIONS',
        recommendedAction: 'Investigate the security risk immediately',
        confidence: 0.98,
        reasoningSummary: 'The ticket contains security-related language.',
        riskIndicators: ['POTENTIAL_SECURITY_INCIDENT'],
      };
    }

    if (
      this.containsAny(ticketText, ['login', 'log in', 'password', 'locked out', 'access account'])
    ) {
      return {
        category: 'AUTHENTICATION',
        priority: 'HIGH',
        recommendedTeam: 'IDENTITY_SUPPORT',
        recommendedAction: 'Review account access and authentication logs',
        confidence: 0.94,
        reasoningSummary: 'The ticket describes an account authentication problem.',
        riskIndicators: [],
      };
    }

    if (this.containsAny(ticketText, ['billing', 'invoice', 'payment', 'charged', 'refund'])) {
      return {
        category: 'BILLING',
        priority: 'MEDIUM',
        recommendedTeam: 'BILLING_SUPPORT',
        recommendedAction: 'Review the customer billing records',
        confidence: 0.92,
        reasoningSummary: 'The ticket describes a billing-related problem.',
        riskIndicators: [],
      };
    }

    if (this.containsAny(ticketText, ['error', 'bug', 'crash', 'not working', 'technical'])) {
      return {
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        recommendedTeam: 'TECHNICAL_SUPPORT',
        recommendedAction: 'Investigate the reported technical problem',
        confidence: 0.9,
        reasoningSummary: 'The ticket describes a technical problem.',
        riskIndicators: [],
      };
    }

    if (
      this.containsAny(ticketText, ['account', 'profile', 'email address', 'customer information'])
    ) {
      return {
        category: 'ACCOUNT',
        priority: 'LOW',
        recommendedTeam: 'ACCOUNT_SUPPORT',
        recommendedAction: 'Review the customer account information',
        confidence: 0.88,
        reasoningSummary: 'The ticket describes an account-related request.',
        riskIndicators: [],
      };
    }

    return {
      category: 'OTHER',
      priority: 'LOW',
      recommendedTeam: 'GENERAL_SUPPORT',
      recommendedAction: 'Review the ticket manually',
      confidence: 0.6,
      reasoningSummary: 'The ticket does not clearly match a supported classification.',
      riskIndicators: ['UNCLEAR_CLASSIFICATION'],
    };
  }

  private containsAny(ticketText: string, keywords: readonly string[]): boolean {
    return keywords.some((keyword) => ticketText.includes(keyword));
  }
}
