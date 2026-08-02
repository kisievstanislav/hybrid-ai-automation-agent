import type { TicketRepository } from '../repositories/index.js';
import type { SupportTeam, Ticket, TicketCategory, TicketPriority } from '../../domain/index.js';

export interface TicketClassificationUpdate {
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly assignedTeam: SupportTeam;
}

export class TicketService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async getAllTickets(): Promise<readonly Ticket[]> {
    return this.ticketRepository.findAll();
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findById(id);
  }

  async updateClassification(
    id: string,
    update: TicketClassificationUpdate,
  ): Promise<Ticket | null> {
    const ticket = await this.ticketRepository.findById(id);

    if (!ticket) {
      return null;
    }

    return this.ticketRepository.update({
      ...ticket,
      category: update.category,
      priority: update.priority,
      assignedTeam: update.assignedTeam,
    });
  }
}
