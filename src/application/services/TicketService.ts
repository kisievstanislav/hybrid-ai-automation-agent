import type { TicketRepository } from "../repositories/index.js";
import type { Ticket } from "../../domain/index.js";

export class TicketService {
  constructor(
    private readonly ticketRepository: TicketRepository,
  ) {}

  async getAllTickets(): Promise<readonly Ticket[]> {
    return this.ticketRepository.findAll();
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findById(id);
  }
}