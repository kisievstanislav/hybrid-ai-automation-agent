import type { Logger } from "pino";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  QueueProcessingOutcome,
  QueueWorker,
  type QueueProcessor,
  type RetryStrategy,
} from "../../../../src/application/queue/index.js";
import type { QueueService } from "../../../../src/application/services/index.js";
import {
  QueueItemStatus,
  type QueueItem,
} from "../../../../src/domain/index.js";

describe("QueueWorker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should complete a successfully processed queue item", async () => {
    const queueItem: QueueItem = {
      id: "QUEUE-1001",
      ticketId: "TKT-1001",
      status: QueueItemStatus.CLAIMED,
      attemptCount: 1,
      correlationId: "CORR-1001",
      workerId: "worker-1",
      createdAt: new Date(),
      claimedAt: new Date(),
      completedAt: null,
      nextAttemptAt: null,
      lastError: null,
    };

    const queueService = {
      claimNextQueueItem: vi
        .fn()
        .mockResolvedValueOnce(queueItem)
        .mockResolvedValue(null),

      markProcessing: vi.fn().mockResolvedValue({
        ...queueItem,
        status: QueueItemStatus.PROCESSING,
      }),

      markCompleted: vi.fn().mockResolvedValue({
        ...queueItem,
        status: QueueItemStatus.COMPLETED,
        completedAt: new Date(),
      }),
    } as unknown as QueueService;

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockResolvedValue({
        outcome: QueueProcessingOutcome.COMPLETED,
      }),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    const worker = new QueueWorker(
      queueService,
      queueProcessor,
      retryStrategy,
      logger,
      {
        workerId: "worker-1",
        pollIntervalMs: 10,
        maxRetryAttempts: 3,
      },
    );

    worker.start();

    await vi.waitFor(() => {
      expect(queueService.markCompleted).toHaveBeenCalledWith(
        "QUEUE-1001",
      );
    });

    await worker.stop();

    expect(
      queueService.claimNextQueueItem,
    ).toHaveBeenCalledWith("worker-1");

    expect(queueService.markProcessing).toHaveBeenCalledWith(
      "QUEUE-1001",
    );

    expect(queueProcessor.process).toHaveBeenCalledWith(
      queueItem,
    );

    expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  });
  it("should schedule a retry for a temporary failure", async () => {
  const queueItem: QueueItem = {
    id: "QUEUE-1002",
    ticketId: "TKT-1002",
    status: QueueItemStatus.CLAIMED,
    attemptCount: 1,
    correlationId: "CORR-1002",
    workerId: "worker-1",
    createdAt: new Date(),
    claimedAt: new Date(),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const queueService = {
    claimNextQueueItem: vi
      .fn()
      .mockResolvedValueOnce(queueItem)
      .mockResolvedValue(null),

    markProcessing: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.PROCESSING,
    }),

    scheduleRetry: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.RETRY_PENDING,
    }),
  } as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi.fn().mockResolvedValue({
      outcome: QueueProcessingOutcome.RETRY,
      errorMessage: "Temporary API error",
    }),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();

  await vi.waitFor(() => {
    expect(queueService.scheduleRetry).toHaveBeenCalled();
  });

  await worker.stop();

  expect(
    retryStrategy.calculateDelayMs,
  ).toHaveBeenCalledWith(1);

  expect(queueService.scheduleRetry).toHaveBeenCalledWith(
    "QUEUE-1002",
    expect.any(Date),
    "Temporary API error",
  );
});

it("should move an item to dead letter after max retries", async () => {
  const queueItem: QueueItem = {
    id: "QUEUE-1003",
    ticketId: "TKT-1003",
    status: QueueItemStatus.CLAIMED,
    attemptCount: 3,
    correlationId: "CORR-1003",
    workerId: "worker-1",
    createdAt: new Date(),
    claimedAt: new Date(),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const queueService = {
    claimNextQueueItem: vi
      .fn()
      .mockResolvedValueOnce(queueItem)
      .mockResolvedValue(null),

    markProcessing: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.PROCESSING,
    }),

    markDeadLetter: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.DEAD_LETTER,
    }),
  } as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi.fn().mockResolvedValue({
      outcome: QueueProcessingOutcome.RETRY,
      errorMessage: "API is still unavailable",
    }),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();

  await vi.waitFor(() => {
    expect(queueService.markDeadLetter).toHaveBeenCalledWith(
      "QUEUE-1003",
      "API is still unavailable",
    );
  });

  await worker.stop();

  expect(
    retryStrategy.calculateDelayMs,
  ).not.toHaveBeenCalled();

  expect(queueService.scheduleRetry).toBeUndefined();
});

it("should retry when the processor throws an error", async () => {
  const queueItem: QueueItem = {
    id: "QUEUE-1004",
    ticketId: "TKT-1004",
    status: QueueItemStatus.CLAIMED,
    attemptCount: 1,
    correlationId: "CORR-1004",
    workerId: "worker-1",
    createdAt: new Date(),
    claimedAt: new Date(),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const queueService = {
    claimNextQueueItem: vi
      .fn()
      .mockResolvedValueOnce(queueItem)
      .mockResolvedValue(null),

    markProcessing: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.PROCESSING,
    }),

    scheduleRetry: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.RETRY_PENDING,
      lastError: "Connection failed",
    }),
  } as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi
      .fn()
      .mockRejectedValue(new Error("Connection failed")),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();

  await vi.waitFor(() => {
    expect(queueService.scheduleRetry).toHaveBeenCalledWith(
      "QUEUE-1004",
      expect.any(Date),
      "Connection failed",
    );
  });

  await worker.stop();

  expect(retryStrategy.calculateDelayMs).toHaveBeenCalledWith(1);

  expect(logger.error).toHaveBeenCalled();
});

it("should send an item to human review", async () => {
  const queueItem: QueueItem = {
    id: "QUEUE-1005",
    ticketId: "TKT-1005",
    status: QueueItemStatus.CLAIMED,
    attemptCount: 1,
    correlationId: "CORR-1005",
    workerId: "worker-1",
    createdAt: new Date(),
    claimedAt: new Date(),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const queueService = {
    claimNextQueueItem: vi
      .fn()
      .mockResolvedValueOnce(queueItem)
      .mockResolvedValue(null),

    markProcessing: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.PROCESSING,
    }),

    markHumanReview: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.HUMAN_REVIEW,
      lastError: "Low confidence result",
    }),
  } as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi.fn().mockResolvedValue({
      outcome: QueueProcessingOutcome.HUMAN_REVIEW,
      errorMessage: "Low confidence result",
    }),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();

  await vi.waitFor(() => {
    expect(queueService.markHumanReview).toHaveBeenCalledWith(
      "QUEUE-1005",
      "Low confidence result",
    );
  });

  await worker.stop();

  expect(queueService.scheduleRetry).toBeUndefined();
  expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalled();
});

it("should mark an item as failed for a permanent processing error", async () => {
  const queueItem: QueueItem = {
    id: "QUEUE-1006",
    ticketId: "TKT-1006",
    status: QueueItemStatus.CLAIMED,
    attemptCount: 1,
    correlationId: "CORR-1006",
    workerId: "worker-1",
    createdAt: new Date(),
    claimedAt: new Date(),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const queueService = {
    claimNextQueueItem: vi
      .fn()
      .mockResolvedValueOnce(queueItem)
      .mockResolvedValue(null),

    markProcessing: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.PROCESSING,
    }),

    markFailed: vi.fn().mockResolvedValue({
      ...queueItem,
      status: QueueItemStatus.FAILED,
      lastError: "Invalid ticket data",
    }),
  } as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi.fn().mockResolvedValue({
      outcome: QueueProcessingOutcome.FAILED,
      errorMessage: "Invalid ticket data",
    }),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();

  await vi.waitFor(() => {
    expect(queueService.markFailed).toHaveBeenCalledWith(
      "QUEUE-1006",
      "Invalid ticket data",
    );
  });

  await worker.stop();

  expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  expect(queueService.scheduleRetry).toBeUndefined();
  expect(logger.error).toHaveBeenCalled();
});

it("should not start a second polling loop when already running", async () => {
  const queueService = {
    claimNextQueueItem: vi.fn().mockResolvedValue(null),
  } as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi.fn(),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();
  worker.start();

  expect(worker.isRunning()).toBe(true);

  expect(logger.warn).toHaveBeenCalledWith(
    {
      workerId: "worker-1",
    },
    "Queue worker is already running",
  );

  await worker.stop();

  expect(worker.isRunning()).toBe(false);

  expect(logger.info).toHaveBeenCalledWith(
    {
      workerId: "worker-1",
    },
    "Queue worker stopped",
  );

  expect(queueProcessor.process).not.toHaveBeenCalled();
});

it("should continue polling after a queue claim error", async () => {
const claimNextQueueItem = vi
  .fn()
  .mockRejectedValueOnce(
    new Error("Database connection failed"),
  )
  .mockResolvedValue(null);

const queueService = {
  claimNextQueueItem,
} as unknown as QueueService;

  const queueProcessor: QueueProcessor = {
    process: vi.fn(),
  };

  const retryStrategy: RetryStrategy = {
    calculateDelayMs: vi.fn().mockReturnValue(1_000),
  };

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;

  const worker = new QueueWorker(
    queueService,
    queueProcessor,
    retryStrategy,
    logger,
    {
      workerId: "worker-1",
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    },
  );

  worker.start();

  await vi.waitFor(() => {
  expect(claimNextQueueItem.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  await worker.stop();

  expect(logger.error).toHaveBeenCalledWith(
    {
      workerId: "worker-1",
      err: expect.any(Error),
    },
    "Queue worker polling failed",
  );

  expect(queueProcessor.process).not.toHaveBeenCalled();
});
});