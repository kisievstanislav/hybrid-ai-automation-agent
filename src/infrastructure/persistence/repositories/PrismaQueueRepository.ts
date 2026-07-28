import type { QueueRepository } from "../../../application/repositories/index.js";
import {
  QueueItemStatus,
  type QueueItem,
} from "../../../domain/index.js";
import {
  QueueItemStatus as PrismaQueueItemStatus,
} from "../../../generated/prisma/enums.js";

import { prisma } from "../../database/prisma-client.js";
import { toDomainQueueItem } from "../mappers/queue-item.mapper.js";

function toPrismaQueueItemStatus(
  status: QueueItemStatus,
): PrismaQueueItemStatus {
  switch (status) {
    case QueueItemStatus.NEW:
      return PrismaQueueItemStatus.NEW;

    case QueueItemStatus.CLAIMED:
      return PrismaQueueItemStatus.CLAIMED;

    case QueueItemStatus.PROCESSING:
      return PrismaQueueItemStatus.PROCESSING;

    case QueueItemStatus.COMPLETED:
      return PrismaQueueItemStatus.COMPLETED;

    case QueueItemStatus.FAILED:
      return PrismaQueueItemStatus.FAILED;

    case QueueItemStatus.HUMAN_REVIEW:
      return PrismaQueueItemStatus.HUMAN_REVIEW;

    case QueueItemStatus.RETRY_PENDING:
      return PrismaQueueItemStatus.RETRY_PENDING;
  }
}

export class PrismaQueueRepository implements QueueRepository {
  async findAll(): Promise<readonly QueueItem[]> {
    const queueItems = await prisma.queueItem.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return queueItems.map(toDomainQueueItem);
  }

  async findById(id: string): Promise<QueueItem | null> {
    const queueItem = await prisma.queueItem.findUnique({
      where: {
        id,
      },
    });

    return queueItem ? toDomainQueueItem(queueItem) : null;
  }

  async claimNext(): Promise<QueueItem | null> {
    return prisma.$transaction(async (transaction) => {
      const candidate = await transaction.queueItem.findFirst({
        where: {
          status: {
            in: [
              PrismaQueueItemStatus.NEW,
              PrismaQueueItemStatus.RETRY_PENDING,
            ],
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!candidate) {
        return null;
      }

      const claimResult = await transaction.queueItem.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status,
        },
        data: {
          status: PrismaQueueItemStatus.CLAIMED,
          claimedAt: new Date(),
        },
      });

      if (claimResult.count === 0) {
        return null;
      }

      const claimedQueueItem =
        await transaction.queueItem.findUniqueOrThrow({
          where: {
            id: candidate.id,
          },
        });

      return toDomainQueueItem(claimedQueueItem);
    });
  }

  async update(queueItem: QueueItem): Promise<QueueItem> {
    const updatedQueueItem = await prisma.queueItem.update({
      where: {
        id: queueItem.id,
      },
      data: {
        status: toPrismaQueueItemStatus(queueItem.status),
        attemptCount: queueItem.attemptCount,
        correlationId: queueItem.correlationId,
        workerId: queueItem.workerId,
        claimedAt: queueItem.claimedAt,
        completedAt: queueItem.completedAt,
        lastError: queueItem.lastError,
      },
    });

    return toDomainQueueItem(updatedQueueItem);
  }
}