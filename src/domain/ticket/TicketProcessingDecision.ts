import { ProcessingDecision } from './ProcessingDecision.js';
import { SupportTeam } from './SupportTeam.js';
import { TicketCategory } from './TicketCategory.js';
import { TicketPriority } from './TicketPriority.js';

export interface TicketProcessingDecision {
  readonly ticketId: string;
  readonly decision: ProcessingDecision;
  readonly approvedCategory: TicketCategory | null;
  readonly approvedPriority: TicketPriority | null;
  readonly approvedTeam: SupportTeam | null;
  readonly confidence: number | null;
  readonly reason: string;
}
