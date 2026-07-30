import type { HttpClient } from '../../../application/ports/api/HttpClient.js';
import { ApiError } from '../../../core/errors/ApiError.js';
import type { Ticket } from '../../../domain/ticket/Ticket.js';
import { ticketListResponseSchema, ticketResponseSchema } from './schemas/ticketResponse.schema.js';
import { TicketApiClient } from './TicketApiClient.js';

export class FastifyTicketApiClient implements TicketApiClient {
  constructor(private readonly httpClient: HttpClient) {}

  async getAllTickets(): Promise<readonly Ticket[]> {
    const response = await this.httpClient.get<unknown>('/tickets');

    const validationResult = ticketListResponseSchema.safeParse(response.data);

    if (!validationResult.success) {
      throw new ApiError('Ticket API returned an invalid ticket list response', {
        retryable: false,
        cause: validationResult.error,
      });
    }

    return validationResult.data;
  }

  async getTicketById(id: string): Promise<Ticket> {
    const response = await this.httpClient.get<unknown>(`/tickets/${encodeURIComponent(id)}`);

    const validationResult = ticketResponseSchema.safeParse(response.data);

    if (!validationResult.success) {
      throw new ApiError(`Ticket API returned an invalid response for ticket ${id}`, {
        retryable: false,
        cause: validationResult.error,
      });
    }

    return validationResult.data;
  }
}
