import type { Logger } from "pino";

import type { QueueItem } from "../../domain/index.js";
import type { QueueService } from "../services/index.js";
import type { QueueProcessor } from "./QueueProcessor.js";
import {
  QueueProcessingOutcome,
  type QueueProcessingResult,
} from "./QueueProcessingResult.js";
import type { RetryStrategy } from "./RetryStrategy.js";

export interface QueueWorkerOptions {
  readonly workerId: string;
  readonly pollIntervalMs: number;
  readonly maxRetryAttempts: number;
}

export class QueueWorker {
  private running = false;
  private pollingPromise: Promise<void> | null = null;

  constructor(
    private readonly queueService: QueueService,
    private readonly queueProcessor: QueueProcessor,
    private readonly retryStrategy: RetryStrategy,
    private readonly logger: Logger,
    private readonly options: QueueWorkerOptions,
  ) {}

  start(): void {
    if (this.running) {
      this.logger.warn(
        {
          workerId: this.options.workerId,
        },
        "Queue worker is already running",
      );

      return;
    }

    this.running = true;

    this.logger.info(
      {
        workerId: this.options.workerId,
      },
      "Queue worker started",
    );

    this.pollingPromise = this.run();
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info(
      {
        workerId: this.options.workerId,
      },
      "Queue worker stopping",
    );

    this.running = false;

    if (this.pollingPromise) {
      await this.pollingPromise;
    }

    this.pollingPromise = null;

    this.logger.info(
      {
        workerId: this.options.workerId,
      },
      "Queue worker stopped",
    );
  }

  isRunning(): boolean {
    return this.running;
  }

  private async run(): Promise<void> {
    while (this.running) {
      try {
        await this.processNextItem();
      } catch (error: unknown) {
        this.logger.error(
          {
            workerId: this.options.workerId,
            err: error,
          },
          "Queue worker polling failed",
        );
      }

      if (this.running) {
        await this.delay(this.options.pollIntervalMs);
      }
    }
  }

  private async processNextItem(): Promise<void> {
    const queueItem =
      await this.queueService.claimNextQueueItem(
        this.options.workerId,
      );

    if (!queueItem) {
      return;
    }

    this.logger.info(
      {
        workerId: this.options.workerId,
        queueItemId: queueItem.id,
        ticketId: queueItem.ticketId,
        attemptCount: queueItem.attemptCount,
      },
      "Queue item claimed",
    );

    await this.queueService.markProcessing(queueItem.id);

    try {
      const result =
        await this.queueProcessor.process(queueItem);

      await this.handleResult(queueItem, result);
    } catch (error: unknown) {
      await this.handleUnexpectedError(queueItem, error);
    }
  }

  private async handleResult(
    queueItem: QueueItem,
    result: QueueProcessingResult,
  ): Promise<void> {
    switch (result.outcome) {
      case QueueProcessingOutcome.COMPLETED:
        await this.queueService.markCompleted(queueItem.id);

        this.logger.info(
          {
            queueItemId: queueItem.id,
            ticketId: queueItem.ticketId,
          },
          "Queue item completed",
        );

        return;

      case QueueProcessingOutcome.RETRY:
        await this.handleRetry(
          queueItem,
          result.errorMessage ??
            "Temporary processing failure.",
        );

        return;

      case QueueProcessingOutcome.FAILED:
        await this.queueService.markFailed(
          queueItem.id,
          result.errorMessage ??
            "Queue processing failed.",
        );

        this.logger.error(
          {
            queueItemId: queueItem.id,
            ticketId: queueItem.ticketId,
            errorMessage: result.errorMessage,
          },
          "Queue item failed",
        );

        return;

      case QueueProcessingOutcome.HUMAN_REVIEW:
        await this.queueService.markHumanReview(
          queueItem.id,
          result.errorMessage ??
            "Human review required.",
        );

        this.logger.warn(
          {
            queueItemId: queueItem.id,
            ticketId: queueItem.ticketId,
            reason: result.errorMessage,
          },
          "Queue item sent to human review",
        );
    }
  }

  private async handleUnexpectedError(
    queueItem: QueueItem,
    error: unknown,
  ): Promise<void> {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown processing error.";

    this.logger.error(
      {
        queueItemId: queueItem.id,
        ticketId: queueItem.ticketId,
        err: error,
      },
      "Unexpected queue processing error",
    );

    await this.handleRetry(queueItem, errorMessage);
  }

  private async handleRetry(
    queueItem: QueueItem,
    errorMessage: string,
  ): Promise<void> {
    if (
      queueItem.attemptCount >=
      this.options.maxRetryAttempts
    ) {
      await this.queueService.markDeadLetter(
        queueItem.id,
        errorMessage,
      );

      this.logger.error(
        {
          queueItemId: queueItem.id,
          ticketId: queueItem.ticketId,
          attemptCount: queueItem.attemptCount,
        },
        "Queue item moved to dead letter",
      );

      return;
    }

    const delayMs =
      this.retryStrategy.calculateDelayMs(
        queueItem.attemptCount,
      );

    const nextAttemptAt = new Date(
      Date.now() + delayMs,
    );

    await this.queueService.scheduleRetry(
      queueItem.id,
      nextAttemptAt,
      errorMessage,
    );

    this.logger.warn(
      {
        queueItemId: queueItem.id,
        ticketId: queueItem.ticketId,
        attemptCount: queueItem.attemptCount,
        nextAttemptAt,
        delayMs,
      },
      "Queue item scheduled for retry",
    );
  }

  private async delay(
    milliseconds: number,
  ): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}