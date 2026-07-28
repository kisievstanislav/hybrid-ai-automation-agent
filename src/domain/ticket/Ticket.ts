import { CustomerType } from "./CustomerType.js";
import { SupportTeam } from "./SupportTeam.js";
import { TicketCategory } from "./TicketCategory.js";
import { TicketPriority } from "./TicketPriority.js";
import { TicketStatus } from "./TicketStatus.js";

export interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly customerType: CustomerType;
  readonly status: TicketStatus;
  readonly priority: TicketPriority | null;
  readonly category: TicketCategory | null;
  readonly assignedTeam: SupportTeam | null;
  readonly tags: readonly string[];
  readonly previousAttempts: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}