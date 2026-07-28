import type { FastifyInstance } from "fastify";

import type { TicketService } from "../../../application/services/index.js";

interface TicketRouteOptions {
  readonly ticketService: TicketService;
}

interface TicketParams {
  readonly id: string;
}

export async function registerTicketRoutes(
  app: FastifyInstance,
  options: TicketRouteOptions,
): Promise<void> {
  const { ticketService } = options;

  app.get("/tickets", async (_request, reply) => {
    const tickets = await ticketService.getAllTickets();

    return reply.status(200).send(tickets);
  });

  app.get<{ Params: TicketParams }>(
    "/tickets/:id",
    async (request, reply) => {
      const ticket = await ticketService.getTicketById(
        request.params.id,
      );

      if (!ticket) {
        return reply.status(404).send({
          code: "TICKET_NOT_FOUND",
          message: `Ticket ${request.params.id} was not found`,
        });
      }

      return reply.status(200).send(ticket);
    },
  );
}