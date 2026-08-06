import { expect, test } from '@playwright/test';
import pino from 'pino';

import { TicketProcessingOrchestrator } from '../../src/application/orchestration/TicketProcessingOrchestrator.js';
import { QueueWorker } from '../../src/application/queue/QueueWorker.js';
import type { RetryStrategy } from '../../src/application/queue/RetryStrategy.js';
import { createBusinessRuleEngine } from '../../src/application/rules/createBusinessRuleEngine.js';
import { QueueService } from '../../src/application/services/QueueService.js';
import {
  CustomerType,
  QueueItemStatus,
  SupportTeam,
  TicketCategory,
  TicketPriority,
} from '../../src/domain/index.js';
import { MockAiProvider } from '../../src/infrastructure/ai/mock/MockAiProvider.js';
import { PlaywrightHttpClient } from '../../src/infrastructure/api/client/PlaywrightHttpClient.js';
import { FastifyTicketApiClient } from '../../src/infrastructure/api/ticket/FastifyTicketApiClient.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';
import { PrismaProcessingResultRecorder } from '../../src/infrastructure/persistence/repositories/PrismaProcessingResultRecorder.js';
import { PrismaQueueRepository } from '../../src/infrastructure/persistence/repositories/PrismaQueueRepository.js';
import { PlaywrightTicketUiService } from '../../src/infrastructure/ui/playwright/index.js';

test.describe('End-to-End Agent Workflow with Mock AI', () => {
  const ticketId = 'TKT-E2E-MOCK-1001';
  const queueItemId = 'QUEUE-E2E-MOCK-1001';
  const correlationId = 'CORR-E2E-MOCK-1001';

  test.beforeEach(async () => {
    await deleteTestData();

    await prisma.ticket.create({
      data: {
        id: ticketId,
        title: 'Unable to access account',
        description: 'Customer cannot log in after resetting the password.',
        customerType: CustomerType.PREMIUM,
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

  test.afterEach(async () => {
    await deleteTestData();
  });

  test('should process a ticket with deterministic Mock AI output', async ({ request }) => {
    const ticketApiClient = new FastifyTicketApiClient(new PlaywrightHttpClient(request));

    const orchestrator = new TicketProcessingOrchestrator(
      ticketApiClient,
      new MockAiProvider(),
      createBusinessRuleEngine(),
      new PlaywrightTicketUiService(),
      new PrismaProcessingResultRecorder(),
      pino({ enabled: false }),
    );

    const worker = createWorker(orchestrator);

    worker.start();

    try {
      await expect
        .poll(() => getQueueStatus(), {
          timeout: 10_000,
        })
        .toBe(QueueItemStatus.COMPLETED);
    } finally {
      await worker.stop();
    }

    const savedTicket = await prisma.ticket.findUniqueOrThrow({
      where: {
        id: ticketId,
      },
    });

    const ticketFromApi = await ticketApiClient.getTicketById(ticketId);

    const completedQueueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    const processingResult = await prisma.processingResult.findFirstOrThrow({
      where: {
        queueItemId,
      },
    });

    expect(savedTicket.category).toBe(TicketCategory.AUTHENTICATION);
    expect(savedTicket.priority).toBe(TicketPriority.HIGH);
    expect(savedTicket.assignedTeam).toBe(SupportTeam.IDENTITY_SUPPORT);

    expect(ticketFromApi.category).toBe(TicketCategory.AUTHENTICATION);
    expect(ticketFromApi.priority).toBe(TicketPriority.HIGH);
    expect(ticketFromApi.assignedTeam).toBe(SupportTeam.IDENTITY_SUPPORT);

    expect(completedQueueItem.status).toBe(QueueItemStatus.COMPLETED);
    expect(completedQueueItem.workerId).toBe('e2e-mock-worker');
    expect(completedQueueItem.attemptCount).toBe(1);
    expect(completedQueueItem.completedAt).not.toBeNull();
    expect(completedQueueItem.lastError).toBeNull();

    expect(processingResult.ticketId).toBe(ticketId);
    expect(processingResult.queueItemId).toBe(queueItemId);
    expect(processingResult.correlationId).toBe(correlationId);
    expect(processingResult.successful).toBe(true);
  });

  function createWorker(orchestrator: TicketProcessingOrchestrator): QueueWorker {
    const retryStrategy: RetryStrategy = {
      calculateDelayMs: () => 1_000,
    };

    return new QueueWorker(
      new QueueService(new PrismaQueueRepository()),
      orchestrator,
      retryStrategy,
      pino({ enabled: false }),
      {
        workerId: 'e2e-mock-worker',
        pollIntervalMs: 50,
        maxRetryAttempts: 3,
      },
    );
  }

  async function getQueueStatus(): Promise<QueueItemStatus | undefined> {
    const queueItem = await prisma.queueItem.findUnique({
      where: {
        id: queueItemId,
      },
    });

    return queueItem?.status as QueueItemStatus | undefined;
  }

  async function deleteTestData(): Promise<void> {
    await prisma.processingResult.deleteMany({
      where: {
        queueItemId,
      },
    });

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
  }
});
