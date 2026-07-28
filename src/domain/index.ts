export type { AuditEvent } from "./audit/index.js";
export { AuditEventType } from "./audit/index.js";

export type { ProcessingResult } from "./processing/index.js";

export type { QueueItem } from "./queue/index.js";
export { QueueItemStatus } from "./queue/index.js";

export type {
  AiClassificationResult,
  Ticket,
  TicketProcessingDecision,
} from "./ticket/index.js";

export {
  CustomerType,
  ProcessingDecision,
  SupportTeam,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "./ticket/index.js";