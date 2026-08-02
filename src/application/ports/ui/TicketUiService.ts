import type { TicketCategory } from '../../../domain/ticket/TicketCategory.js';
import type { TicketPriority } from '../../../domain/ticket/TicketPriority.js';
import type { SupportTeam } from '../../../domain/ticket/SupportTeam.js';

export interface TicketUiUpdate {
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly assignedTeam: SupportTeam;
}

export interface TicketUiService {
  updateTicket(ticketId: string, update: TicketUiUpdate): Promise<void>;
}
