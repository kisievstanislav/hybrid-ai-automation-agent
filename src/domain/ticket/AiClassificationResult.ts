import { SupportTeam } from './SupportTeam.js';
import { TicketCategory } from './TicketCategory.js';
import { TicketPriority } from './TicketPriority.js';

export interface AiClassificationResult {
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly recommendedTeam: SupportTeam;
  readonly recommendedAction: string;
  readonly confidence: number;
  readonly reasoningSummary: string;
  readonly riskIndicators: readonly string[];
}
