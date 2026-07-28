import { QueueItemStatus } from "./QueueItemStatus.js";

export interface QueueItem {
  readonly id: string;
  readonly ticketId: string;
  readonly status: QueueItemStatus;
  readonly attemptCount: number;
  readonly correlationId: string;
  readonly workerId: string | null;
  readonly createdAt: Date;
  readonly claimedAt: Date | null;
  readonly completedAt: Date | null;
  readonly lastError: string | null;
}