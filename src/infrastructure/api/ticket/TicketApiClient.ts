import { Ticket } from "../../../domain/index.js";

export interface TicketApiClient {
  getAllTickets(): Promise<readonly Ticket[]>;

  getTicketById(id: string): Promise<Ticket>;
}