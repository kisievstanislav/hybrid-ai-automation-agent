import type { Logger } from 'pino';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../src/infrastructure/database/prisma-client.js';
import { CustomerType, QueueItemStatus } from '../../../src/domain/index.js';
import { PrismaQueueRepository } from '../../../src/infrastructure/persistence/repositories/PrismaQueueRepository.js';
import { QueueProcessingOutcome } from '../../../src/application/queue/QueueProcessingResult.js';
import { QueueProcessor } from '../../../src/application/queue/QueueProcessor.js';
import { QueueWorker } from '../../../src/application/queue/QueueWorker.js';
import { RetryStrategy } from '../../../src/application/queue/RetryStrategy.js';
import { QueueService } from '../../../src/application/services/QueueService.js';

describe('QueueWorker integration', () => {
  const ticketId = 'TKT-INTEGRATION-1001';
  const queueItemId = 'QUEUE-INTEGRATION-1001';
  const correlationId = 'CORR-INTEGRATION-1001';

  /**
   * Before every test:
   *
   * 1. Remove old test data.
   * 2. Create a real Ticket.
   * 3. Create a real QueueItem linked to that Ticket.
   *
   * This gives every test a clean database state.
   */
  beforeEach(async () => {
    await prisma.queueItem.deleteMany({
      where: {
        id: queueItemId,
      },
    });

    await prisma.ticket.deleteMany({
      where: {
        id: ticketId,
      },
    });

    await prisma.ticket.create({
      data: {
        id: ticketId,
        title: 'Integration test ticket',
        description: 'Verify QueueWorker behavior using the real database.',
        customerType: CustomerType.STANDARD,
        tags: [],
      },
    });

    await prisma.queueItem.create({
      data: {
        id: queueItemId,
        ticketId,
        correlationId,
        status: QueueItemStatus.NEW,
      },
    });
  });

  /**
   * After every test:
   *
   * 1. Delete the QueueItem.
   * 2. Delete the Ticket.
   * 3. Restore all Vitest mocks.
   *
   * QueueItem must be deleted first because it references Ticket.
   */
  afterEach(async () => {
    await prisma.queueItem.deleteMany({
      where: {
        id: queueItemId,
      },
    });

    await prisma.ticket.deleteMany({
      where: {
        id: ticketId,
      },
    });

    vi.restoreAllMocks();
  });

  /**
   * Disconnect Prisma after all tests finish.
   *
   * This prevents the test process from staying open.
   */
  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Test 1: Successful processing
   *
   * Flow:
   *
   * NEW
   * → CLAIMED
   * → PROCESSING
   * → COMPLETED
   *
   * This verifies:
   * - the worker claims the item
   * - workerId is stored
   * - attemptCount increases
   * - processor is called
   * - completedAt is saved
   */
  it('should complete a queue item using the real repository and database', async () => {
    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockResolvedValue({
        outcome: QueueProcessingOutcome.COMPLETED,
      }),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = createTestLogger();

    const worker = new QueueWorker(queueService, queueProcessor, retryStrategy, logger, {
      workerId: 'integration-worker-1',
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    });

    worker.start();

    await waitForQueueStatus(queueItemId, QueueItemStatus.COMPLETED);

    await worker.stop();

    const completedQueueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    expect(completedQueueItem.status).toBe(QueueItemStatus.COMPLETED);

    expect(completedQueueItem.workerId).toBe('integration-worker-1');

    expect(completedQueueItem.attemptCount).toBe(1);
    expect(completedQueueItem.claimedAt).not.toBeNull();
    expect(completedQueueItem.completedAt).not.toBeNull();
    expect(completedQueueItem.nextAttemptAt).toBeNull();
    expect(completedQueueItem.lastError).toBeNull();

    expect(queueProcessor.process).toHaveBeenCalledTimes(1);

    expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  });

  /**
   * Test 2: Retry flow
   *
   * Flow:
   *
   * NEW
   * → CLAIMED
   * → PROCESSING
   * → RETRY_PENDING
   *
   * This verifies:
   * - a temporary problem does not permanently fail the item
   * - retry delay is calculated
   * - nextAttemptAt is saved
   * - the error message is saved
   */
  it('should schedule a retry using the real repository', async () => {
    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockResolvedValue({
        outcome: QueueProcessingOutcome.RETRY,
        errorMessage: 'Temporary API outage',
      }),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = createTestLogger();

    const worker = new QueueWorker(queueService, queueProcessor, retryStrategy, logger, {
      workerId: 'integration-worker-1',
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    });

    worker.start();

    await waitForQueueStatus(queueItemId, QueueItemStatus.RETRY_PENDING);

    await worker.stop();

    const queueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    expect(queueItem.status).toBe(QueueItemStatus.RETRY_PENDING);

    expect(queueItem.attemptCount).toBe(1);
    expect(queueItem.nextAttemptAt).not.toBeNull();
    expect(queueItem.lastError).toBe('Temporary API outage');
    expect(queueItem.completedAt).toBeNull();

    expect(retryStrategy.calculateDelayMs).toHaveBeenCalledWith(1);
  });

  /**
   * Test 3: Dead Letter flow
   *
   * Before the worker claims the item:
   *
   * attemptCount = 2
   *
   * When the worker claims it:
   *
   * attemptCount becomes 3
   *
   * Since maxRetryAttempts is 3, the item must not be retried.
   *
   * Flow:
   *
   * NEW
   * → CLAIMED
   * → PROCESSING
   * → DEAD_LETTER
   */
  it('should move an item to dead letter after max retry attempts', async () => {
    await prisma.queueItem.update({
      where: {
        id: queueItemId,
      },
      data: {
        attemptCount: 2,
      },
    });

    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockResolvedValue({
        outcome: QueueProcessingOutcome.RETRY,
        errorMessage: 'External service unavailable',
      }),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = createTestLogger();

    const worker = new QueueWorker(queueService, queueProcessor, retryStrategy, logger, {
      workerId: 'integration-worker-1',
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    });

    worker.start();

    await waitForQueueStatus(queueItemId, QueueItemStatus.DEAD_LETTER);

    await worker.stop();

    const queueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    expect(queueItem.status).toBe(QueueItemStatus.DEAD_LETTER);

    expect(queueItem.attemptCount).toBe(3);
    expect(queueItem.lastError).toBe('External service unavailable');
    expect(queueItem.completedAt).not.toBeNull();
    expect(queueItem.nextAttemptAt).toBeNull();

    expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  });

  /**
   * Test 4: Human Review flow
   *
   * Flow:
   *
   * NEW
   * → CLAIMED
   * → PROCESSING
   * → HUMAN_REVIEW
   *
   * This verifies:
   * - unclear cases are not completed automatically
   * - unclear cases are not retried
   * - the reason is stored for the reviewer
   */
  it('should send an item to human review using the real repository', async () => {
    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockResolvedValue({
        outcome: QueueProcessingOutcome.HUMAN_REVIEW,
        errorMessage: 'Low confidence result',
      }),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = createTestLogger();

    const worker = new QueueWorker(queueService, queueProcessor, retryStrategy, logger, {
      workerId: 'integration-worker-1',
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    });

    worker.start();

    await waitForQueueStatus(queueItemId, QueueItemStatus.HUMAN_REVIEW);

    await worker.stop();

    const queueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    expect(queueItem.status).toBe(QueueItemStatus.HUMAN_REVIEW);

    expect(queueItem.attemptCount).toBe(1);
    expect(queueItem.lastError).toBe('Low confidence result');
    expect(queueItem.completedAt).not.toBeNull();
    expect(queueItem.nextAttemptAt).toBeNull();

    expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  });

  /**
   * Test 5: Permanent failure flow
   *
   * Flow:
   *
   * NEW
   * → CLAIMED
   * → PROCESSING
   * → FAILED
   *
   * This verifies:
   * - permanent errors are not retried
   * - the error message is stored
   * - completedAt is saved because processing has ended
   */
  it('should mark an item as failed using the real repository', async () => {
    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockResolvedValue({
        outcome: QueueProcessingOutcome.FAILED,
        errorMessage: 'Invalid ticket data',
      }),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = createTestLogger();

    const worker = new QueueWorker(queueService, queueProcessor, retryStrategy, logger, {
      workerId: 'integration-worker-1',
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    });

    worker.start();

    await waitForQueueStatus(queueItemId, QueueItemStatus.FAILED);

    await worker.stop();

    const queueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    expect(queueItem.status).toBe(QueueItemStatus.FAILED);

    expect(queueItem.attemptCount).toBe(1);
    expect(queueItem.lastError).toBe('Invalid ticket data');
    expect(queueItem.completedAt).not.toBeNull();
    expect(queueItem.nextAttemptAt).toBeNull();

    expect(retryStrategy.calculateDelayMs).not.toHaveBeenCalled();
  });

  /**
   * Test 6: Unexpected processor exception
   *
   * The processor throws instead of returning a structured result.
   *
   * Flow:
   *
   * Processor throws Error
   * → worker catches it
   * → item becomes RETRY_PENDING
   *
   * This verifies that one processor crash does not crash the worker.
   */
  it('should schedule a retry when the processor throws an error', async () => {
    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const queueProcessor: QueueProcessor = {
      process: vi.fn().mockRejectedValue(new Error('Connection failed')),
    };

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: vi.fn().mockReturnValue(1_000),
    };

    const logger = createTestLogger();

    const worker = new QueueWorker(queueService, queueProcessor, retryStrategy, logger, {
      workerId: 'integration-worker-1',
      pollIntervalMs: 10,
      maxRetryAttempts: 3,
    });

    worker.start();

    await waitForQueueStatus(queueItemId, QueueItemStatus.RETRY_PENDING);

    await worker.stop();

    const queueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    expect(queueItem.status).toBe(QueueItemStatus.RETRY_PENDING);

    expect(queueItem.attemptCount).toBe(1);
    expect(queueItem.lastError).toBe('Connection failed');
    expect(queueItem.nextAttemptAt).not.toBeNull();
    expect(queueItem.completedAt).toBeNull();

    expect(retryStrategy.calculateDelayMs).toHaveBeenCalledWith(1);

    expect(logger.error).toHaveBeenCalled();
  });
});

/**
 * Creates a lightweight logger mock for integration tests.
 *
 * We use the real database and repository, but logging does not need
 * to write real output during these tests.
 */
function createTestLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;
}

/**
 * Waits until the QueueItem reaches the expected database status.
 *
 * The QueueWorker runs asynchronously in a polling loop, so the test
 * cannot check the database immediately.
 */
async function waitForQueueStatus(
  queueItemId: string,
  expectedStatus: QueueItemStatus,
): Promise<void> {
  await vi.waitFor(
    async () => {
      const queueItem = await prisma.queueItem.findUnique({
        where: {
          id: queueItemId,
        },
      });

      expect(queueItem?.status).toBe(expectedStatus);
    },
    {
      timeout: 3_000,
      interval: 20,
    },
  );
}
