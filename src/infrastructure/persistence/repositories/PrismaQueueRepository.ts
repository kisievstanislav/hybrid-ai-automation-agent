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

    case QueueItemStatus.DEAD_LETTER:
      return PrismaQueueItemStatus.DEAD_LETTER;
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

  async claimNext(
    workerId: string,
  ): Promise<QueueItem | null> {
    return prisma.$transaction(async (transaction) => {
      const candidate = await transaction.queueItem.findFirst({
        where: {
          OR: [
            {
              status: PrismaQueueItemStatus.NEW,
            },
            {
              status: PrismaQueueItemStatus.RETRY_PENDING,
              nextAttemptAt: {
                lte: new Date(),
              },
            },
          ],
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
          workerId,
          claimedAt: new Date(),
          nextAttemptAt: null,
          attemptCount: {
            increment: 1,
          },
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

  async updateStatus(
  queueItemId: string,
  status: QueueItemStatus,
  options: {
    readonly completedAt?: Date | null;
    readonly nextAttemptAt?: Date | null;
    readonly lastError?: string | null;
  } = {},
): Promise<QueueItem> {
  const updatedQueueItem = await prisma.queueItem.update({
    where: {
      id: queueItemId,
    },
    data: {
      status: toPrismaQueueItemStatus(status),

      ...(options.completedAt !== undefined && {
        completedAt: options.completedAt,
      }),

      ...(options.nextAttemptAt !== undefined && {
        nextAttemptAt: options.nextAttemptAt,
      }),

      ...(options.lastError !== undefined && {
        lastError: options.lastError,
      }),
    },
  });

  return toDomainQueueItem(updatedQueueItem);
}
}