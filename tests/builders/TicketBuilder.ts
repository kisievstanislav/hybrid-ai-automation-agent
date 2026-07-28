import {
  CustomerType,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../src/domain/index.js";

import type { Ticket } from "../../src/domain/index.js";

export class TicketBuilder {
  private ticket: Ticket = {
    id: "TKT-1001",
    title: "Unable to access account",
    description:
      "The customer reset the password three times but still cannot log in.",
    customerType: CustomerType.STANDARD,
    status: TicketStatus.NEW,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: [],
    previousAttempts: 0,
    createdAt: new Date("2026-07-25T14:30:00Z"),
    updatedAt: new Date("2026-07-25T14:30:00Z"),
  };

  withCustomerType(customerType: CustomerType): this {
    this.ticket = {
      ...this.ticket,
      customerType,
    };

    return this;
  }

  withPriority(priority: TicketPriority | null): this {
    this.ticket = {
      ...this.ticket,
      priority,
    };

    return this;
  }

  withCategory(category: TicketCategory | null): this {
    this.ticket = {
      ...this.ticket,
      category,
    };

    return this;
  }

  withAssignedTeam(team: SupportTeam | null): this {
    this.ticket = {
      ...this.ticket,
      assignedTeam: team,
    };

    return this;
  }

  withPreviousAttempts(previousAttempts: number): this {
    this.ticket = {
      ...this.ticket,
      previousAttempts,
    };

    return this;
  }

  build(): Ticket {
    return this.ticket;
  }
}