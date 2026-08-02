import { Ticket } from '../../../domain/index.js';

export type AiTicketCategory =
  'AUTHENTICATION' | 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'SECURITY' | 'OTHER';

export type AiTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AiClassificationResult {
  readonly category: AiTicketCategory;
  readonly priority: AiTicketPriority;
  readonly recommendedTeam: string;
  readonly recommendedAction: string;
  readonly confidence: number;
  readonly reasoningSummary: string;
  readonly riskIndicators: readonly string[];
}

export interface AiProvider {
  classifyTicket(ticket: Ticket): Promise<AiClassificationResult>;
}
