import { z } from "zod";

import { CustomerType } from "../../../../domain/ticket/CustomerType.js";
import { SupportTeam } from "../../../../domain/ticket/SupportTeam.js";
import { TicketCategory } from "../../../../domain/ticket/TicketCategory.js";
import { TicketPriority } from "../../../../domain/ticket/TicketPriority.js";
import { TicketStatus } from "../../../../domain/ticket/TicketStatus.js";

export const ticketResponseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),

  customerType: z.enum(CustomerType),
  status: z.enum(TicketStatus),

  priority: z
    .enum(TicketPriority)
    .nullish()
    .transform((value) => value ?? null),

  category: z
    .enum(TicketCategory)
    .nullish()
    .transform((value) => value ?? null),

  assignedTeam: z
    .enum(SupportTeam)
    .nullish()
    .transform((value) => value ?? null),

  tags: z.array(z.string()),

  previousAttempts: z.number().int().nonnegative(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ticketListResponseSchema = z.array(ticketResponseSchema);