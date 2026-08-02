import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { TicketService } from '../../../application/services/index.js';
import { SupportTeam, TicketCategory, TicketPriority } from '../../../domain/index.js';

interface TicketRouteOptions {
  readonly ticketService: TicketService;
}

interface TicketParams {
  readonly id: string;
}

const ticketClassificationUpdateSchema = z.object({
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority),
  assignedTeam: z.nativeEnum(SupportTeam),
});

export async function registerTicketRoutes(
  app: FastifyInstance,
  options: TicketRouteOptions,
): Promise<void> {
  const { ticketService } = options;

  app.get('/tickets', async (_request, reply) => {
    const tickets = await ticketService.getAllTickets();

    return reply.status(200).send(tickets);
  });

  app.get<{ Params: TicketParams }>('/tickets/:id', async (request, reply) => {
    const ticket = await ticketService.getTicketById(request.params.id);

    if (!ticket) {
      return reply.status(404).send({
        code: 'TICKET_NOT_FOUND',
        message: `Ticket ${request.params.id} was not found`,
      });
    }

    return reply.status(200).send(ticket);
  });

  app.patch<{ Params: TicketParams; Body: unknown }>(
    '/tickets/:id/classification',
    async (request, reply) => {
      const validationResult = ticketClassificationUpdateSchema.safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          code: 'INVALID_TICKET_CLASSIFICATION',
          message: 'Category, priority, or assigned team is invalid',
          details: validationResult.error.flatten(),
        });
      }

      const ticket = await ticketService.updateClassification(
        request.params.id,
        validationResult.data,
      );

      if (!ticket) {
        return reply.status(404).send({
          code: 'TICKET_NOT_FOUND',
          message: `Ticket ${request.params.id} was not found`,
        });
      }

      return reply.status(200).send(ticket);
    },
  );
}
