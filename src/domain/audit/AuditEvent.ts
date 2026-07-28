import { AuditEventType } from "./AuditEventType.js";

export interface AuditEvent {
  readonly id: string;
  readonly ticketId: string;
  readonly queueItemId: string;
  readonly correlationId: string;
  readonly eventType: AuditEventType;
  readonly eventData: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
}