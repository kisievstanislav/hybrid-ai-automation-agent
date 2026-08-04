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
import { PlaywrightHttpClient } from '../../src/infrastructure/api/client/PlaywrightHttpClient.js';
import { FastifyTicketApiClient } from '../../src/infrastructure/api/ticket/FastifyTicketApiClient.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';
import { PrismaQueueRepository } from '../../src/infrastructure/persistence/repositories/PrismaQueueRepository.js';
import { PlaywrightTicketUiService } from '../../src/infrastructure/ui/playwright/index.js';
import { MockAiProvider } from '../../src/infrastructure/ai/mock/MockAiProvider.js';

test.describe('End-to-End Agent Workflow', () => {
  const ticketId = 'TKT-E2E-1001';
  const queueItemId = 'QUEUE-E2E-1001';

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
        correlationId: 'CORR-E2E-1001',
        status: QueueItemStatus.NEW,
      },
    });
  });

  test.afterEach(async () => {
    await deleteTestData();
  });

  test('should process a ticket and complete the queue item', async ({ request }) => {
    const httpClient = new PlaywrightHttpClient(request);
    const ticketApiClient = new FastifyTicketApiClient(httpClient);

    const aiProvider = new MockAiProvider();
    const businessRuleEngine = createBusinessRuleEngine();
    const ticketUiService = new PlaywrightTicketUiService();

    const logger = pino({
      enabled: false,
    });

    const orchestrator = new TicketProcessingOrchestrator(
      ticketApiClient,
      aiProvider,
      businessRuleEngine,
      ticketUiService,
      logger,
    );

    const queueRepository = new PrismaQueueRepository();
    const queueService = new QueueService(queueRepository);

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: () => 1_000,
    };

    const worker = new QueueWorker(queueService, orchestrator, retryStrategy, logger, {
      workerId: 'e2e-worker-1',
      pollIntervalMs: 50,
      maxRetryAttempts: 3,
    });

    worker.start();

    try {
      await expect
        .poll(
          async () => {
            const queueItem = await prisma.queueItem.findUnique({
              where: {
                id: queueItemId,
              },
            });

            return queueItem?.status;
          },
          {
            timeout: 10_000,
          },
        )
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

    expect(savedTicket.category).toBe(TicketCategory.AUTHENTICATION);
    expect(savedTicket.priority).toBe(TicketPriority.HIGH);
    expect(savedTicket.assignedTeam).toBe(SupportTeam.IDENTITY_SUPPORT);

    expect(ticketFromApi.category).toBe(TicketCategory.AUTHENTICATION);
    expect(ticketFromApi.priority).toBe(TicketPriority.HIGH);
    expect(ticketFromApi.assignedTeam).toBe(SupportTeam.IDENTITY_SUPPORT);

    expect(completedQueueItem.status).toBe(QueueItemStatus.COMPLETED);
    expect(completedQueueItem.workerId).toBe('e2e-worker-1');
    expect(completedQueueItem.attemptCount).toBe(1);
    expect(completedQueueItem.completedAt).not.toBeNull();
    expect(completedQueueItem.lastError).toBeNull();
  });

  test('should send an unclear ticket to human review without updating the UI', async ({
    request,
  }) => {
    await prisma.queueItem.deleteMany({
      where: {
        id: queueItemId,
      },
    });

    await prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        title: 'Unknown customer issue',
        description: 'Customer provided unclear information.',
        customerType: CustomerType.STANDARD,
      },
    });

    await prisma.queueItem.create({
      data: {
        id: queueItemId,
        ticketId,
        correlationId: 'CORR-E2E-HUMAN-REVIEW',
        status: QueueItemStatus.NEW,
      },
    });

    const httpClient = new PlaywrightHttpClient(request);
    const ticketApiClient = new FastifyTicketApiClient(httpClient);

    let uiUpdateCalled = false;

    const ticketUiService = {
      updateTicket: async (): Promise<void> => {
        uiUpdateCalled = true;
      },
    };

    const logger = pino({
      enabled: false,
    });

    const orchestrator = new TicketProcessingOrchestrator(
      ticketApiClient,
      new MockAiProvider(),
      createBusinessRuleEngine(),
      ticketUiService,
      logger,
    );

    const queueService = new QueueService(new PrismaQueueRepository());

    const retryStrategy: RetryStrategy = {
      calculateDelayMs: () => 1_000,
    };

    const worker = new QueueWorker(queueService, orchestrator, retryStrategy, logger, {
      workerId: 'e2e-worker-1',
      pollIntervalMs: 50,
      maxRetryAttempts: 3,
    });

    worker.start();

    try {
      await expect
        .poll(
          async () => {
            const queueItem = await prisma.queueItem.findUnique({
              where: {
                id: queueItemId,
              },
            });

            return queueItem?.status;
          },
          {
            timeout: 10_000,
          },
        )
        .toBe(QueueItemStatus.HUMAN_REVIEW);
    } finally {
      await worker.stop();
    }

    const queueItem = await prisma.queueItem.findUniqueOrThrow({
      where: {
        id: queueItemId,
      },
    });

    const savedTicket = await prisma.ticket.findUniqueOrThrow({
      where: {
        id: ticketId,
      },
    });

    expect(queueItem.status).toBe(QueueItemStatus.HUMAN_REVIEW);
    expect(queueItem.lastError).toBe('AI confidence 0.6 is below the minimum threshold 0.8.');
    expect(queueItem.completedAt).not.toBeNull();

    expect(uiUpdateCalled).toBe(false);

    expect(savedTicket.category).toBeNull();
    expect(savedTicket.priority).toBeNull();
    expect(savedTicket.assignedTeam).toBeNull();
  });

  async function deleteTestData(): Promise<void> {
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
