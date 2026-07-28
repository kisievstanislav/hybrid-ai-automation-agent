import type { Prisma } from "../../../generated/prisma/client.js";
import {
  QueueItemStatus,
  type QueueItem,
} from "../../../domain/index.js";

type PrismaQueueItem = Prisma.QueueItemGetPayload<Record<string, never>>;

function toDomainQueueItemStatus(status: string): QueueItemStatus {
  switch (status) {
    case "NEW":
      return QueueItemStatus.NEW;

    case "CLAIMED":
      return QueueItemStatus.CLAIMED;

    case "PROCESSING":
      return QueueItemStatus.PROCESSING;

    case "COMPLETED":
      return QueueItemStatus.COMPLETED;

    case "FAILED":
      return QueueItemStatus.FAILED;

    case "HUMAN_REVIEW":
      return QueueItemStatus.HUMAN_REVIEW;

    case "RETRY_PENDING":
      return QueueItemStatus.RETRY_PENDING;

    default:
      throw new Error(`Unsupported queue item status: ${status}`);
  }
}

export function toDomainQueueItem(
  queueItem: PrismaQueueItem,
): QueueItem {
  return {
    id: queueItem.id,
    ticketId: queueItem.ticketId,
    status: toDomainQueueItemStatus(queueItem.status),
    attemptCount: queueItem.attemptCount,
    correlationId: queueItem.correlationId,
    workerId: queueItem.workerId,
    createdAt: queueItem.createdAt,
    claimedAt: queueItem.claimedAt,
    completedAt: queueItem.completedAt,
    lastError: queueItem.lastError,
  };
}