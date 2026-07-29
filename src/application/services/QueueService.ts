import {
  QueueItemStatus,
  type QueueItem,
} from "../../domain/index.js";
import type { QueueRepository } from "../repositories/index.js";

export class QueueService {
  constructor(
    private readonly queueRepository: QueueRepository,
  ) {}

  async getAllQueueItems(): Promise<readonly QueueItem[]> {
    return this.queueRepository.findAll();
  }

  async getQueueItemById(
    id: string,
  ): Promise<QueueItem | null> {
    return this.queueRepository.findById(id);
  }

  async claimNextQueueItem(
    workerId: string,
  ): Promise<QueueItem | null> {
    if (workerId.trim().length === 0) {
      throw new Error("Worker ID must not be empty.");
    }

    return this.queueRepository.claimNext(workerId);
  }

  async markProcessing(
    queueItemId: string,
  ): Promise<QueueItem> {
    return this.queueRepository.updateStatus(
      queueItemId,
      QueueItemStatus.PROCESSING,
      {
        lastError: null,
      },
    );
  }

  async markCompleted(
    queueItemId: string,
  ): Promise<QueueItem> {
    return this.queueRepository.updateStatus(
      queueItemId,
      QueueItemStatus.COMPLETED,
      {
        completedAt: new Date(),
        nextAttemptAt: null,
        lastError: null,
      },
    );
  }

  async scheduleRetry(
    queueItemId: string,
    nextAttemptAt: Date,
    errorMessage: string,
  ): Promise<QueueItem> {
    return this.queueRepository.updateStatus(
      queueItemId,
      QueueItemStatus.RETRY_PENDING,
      {
        completedAt: null,
        nextAttemptAt,
        lastError: errorMessage,
      },
    );
  }

  async markFailed(
    queueItemId: string,
    errorMessage: string,
  ): Promise<QueueItem> {
    return this.queueRepository.updateStatus(
      queueItemId,
      QueueItemStatus.FAILED,
      {
        completedAt: new Date(),
        nextAttemptAt: null,
        lastError: errorMessage,
      },
    );
  }

  async markHumanReview(
    queueItemId: string,
    reason: string,
  ): Promise<QueueItem> {
    return this.queueRepository.updateStatus(
      queueItemId,
      QueueItemStatus.HUMAN_REVIEW,
      {
        completedAt: new Date(),
        nextAttemptAt: null,
        lastError: reason,
      },
    );
  }

  async markDeadLetter(
    queueItemId: string,
    errorMessage: string,
  ): Promise<QueueItem> {
    return this.queueRepository.updateStatus(
      queueItemId,
      QueueItemStatus.DEAD_LETTER,
      {
        completedAt: new Date(),
        nextAttemptAt: null,
        lastError: errorMessage,
      },
    );
  }
}