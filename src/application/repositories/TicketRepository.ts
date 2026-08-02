import type { Ticket } from '../../domain/index.js';

export interface TicketRepository {
  findAll(): Promise<readonly Ticket[]>;

  findById(id: string): Promise<Ticket | null>;

  update(ticket: Ticket): Promise<Ticket>;
}
