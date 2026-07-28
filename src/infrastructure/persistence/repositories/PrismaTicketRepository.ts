import type { TicketRepository } from "../../../application/repositories/index.js";
import type { Ticket } from "../../../domain/index.js";

import { prisma } from "../../database/prisma-client.js";
import { toDomainTicket } from "../mappers/ticket.mapper.js";

export class PrismaTicketRepository implements TicketRepository {
  async findAll(): Promise<readonly Ticket[]> {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return tickets.map(toDomainTicket);
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id,
      },
    });

    return ticket ? toDomainTicket(ticket) : null;
  }

  async update(ticket: Ticket): Promise<Ticket> {
    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        title: ticket.title,
        description: ticket.description,
        customerType: ticket.customerType,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        assignedTeam: ticket.assignedTeam,
        tags: [...ticket.tags],
        previousAttempts: ticket.previousAttempts,
      },
    });

    return toDomainTicket(updatedTicket);
  }
}