import type {
  QueueItem,
  QueueItemStatus,
} from "../../domain/index.js";

export interface QueueRepository {
  findAll(): Promise<readonly QueueItem[]>;

  findById(id: string): Promise<QueueItem | null>;

  claimNext(workerId: string): Promise<QueueItem | null>;

  updateStatus(
    queueItemId: string,
    status: QueueItemStatus,
    options?: {
      readonly completedAt?: Date | null;
      readonly nextAttemptAt?: Date | null;
      readonly lastError?: string | null;
    },
  ): Promise<QueueItem>;
}