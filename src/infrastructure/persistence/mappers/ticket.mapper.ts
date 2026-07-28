import type { Prisma } from "../../../generated/prisma/client.js";

import {
  CustomerType,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type Ticket,
} from "../../../domain/index.js";

type PrismaTicket = Prisma.TicketGetPayload<Record<string, never>>;

export function toDomainTicket(ticket: PrismaTicket): Ticket {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,

    customerType:
      CustomerType[ticket.customerType as keyof typeof CustomerType],

    status: TicketStatus[ticket.status as keyof typeof TicketStatus],

    priority:
      TicketPriority[ticket.priority as keyof typeof TicketPriority],

    category:
      TicketCategory[ticket.category as keyof typeof TicketCategory],

    assignedTeam:
      SupportTeam[ticket.assignedTeam as keyof typeof SupportTeam],

    tags: ticket.tags as readonly string[],
    previousAttempts: ticket.previousAttempts,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}