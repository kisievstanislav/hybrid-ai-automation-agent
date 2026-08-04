import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';

import type { AiProvider } from '../../../../src/application/ports/ai/AiProvider.js';
import type { TicketUiService } from '../../../../src/application/ports/ui/TicketUiService.js';
import { QueueProcessingOutcome } from '../../../../src/application/queue/QueueProcessingResult.js';
import { BusinessRuleEngine } from '../../../../src/application/rules/BusinessRuleEngine.js';
import { TicketProcessingOrchestrator } from '../../../../src/application/orchestration/TicketProcessingOrchestrator.js';
import type { QueueItem, Ticket } from '../../../../src/domain/index.js';
import {
  CustomerType,
  QueueItemStatus,
  TicketStatus,
} from '../../../../src/domain/index.js';
import type { TicketApiClient } from '../../../../src/infrastructure/api/ticket/TicketApiClient.js';

describe('TicketProcessingOrchestrator', () => {
  it('should update an approved ticket and return completed', async () => {
    const ticket: Ticket = {
      id: 'TKT-1001',
      title: 'Unable to access account',
      description: 'Customer cannot log in after resetting the password.',
      customerType: CustomerType.PREMIUM,
      status: TicketStatus.NEW,
      priority: null,
      category: null,
      assignedTeam: null,
      tags: [],
      previousAttempts: 0,
      createdAt: new Date('2026-08-01T10:00:00Z'),
      updatedAt: new Date('2026-08-01T10:00:00Z'),
    };

    const queueItem: QueueItem = {
      id: 'QUEUE-1001',
      ticketId: ticket.id,
      status: QueueItemStatus.PROCESSING,
      attemptCount: 1,
      correlationId: 'correlation-1001',
      workerId: 'worker-1',
      createdAt: new Date('2026-08-01T10:00:00Z'),
      claimedAt: new Date('2026-08-01T10:01:00Z'),
      completedAt: null,
      nextAttemptAt: null,
      lastError: null,
    };

    const ticketApiClient: TicketApiClient = {
      getAllTickets: vi.fn(),
      getTicketById: vi.fn().mockResolvedValue(ticket),
    };

    const aiProvider: AiProvider = {
      classifyTicket: vi.fn().mockResolvedValue({
        category: 'AUTHENTICATION',
        priority: 'HIGH',
        recommendedTeam: 'IDENTITY_SUPPORT',
        recommendedAction: 'Review authentication logs',
        confidence: 0.94,
        reasoningSummary: 'The ticket describes a login problem.',
        riskIndicators: [],
      }),
    };

    const ticketUiService: TicketUiService = {
      updateTicket: vi.fn().mockResolvedValue(undefined),
    };

    const businessRuleEngine = new BusinessRuleEngine([]);

    const orchestrator = new TicketProcessingOrchestrator(
      ticketApiClient,
      aiProvider,
      businessRuleEngine,
      ticketUiService,
      pino({ enabled: false }),
    );

    const result = await orchestrator.process(queueItem);

    expect(result).toEqual({
      outcome: QueueProcessingOutcome.COMPLETED,
    });

    expect(ticketApiClient.getTicketById).toHaveBeenCalledWith(ticket.id);

    expect(aiProvider.classifyTicket).toHaveBeenCalledWith(ticket);

    expect(ticketUiService.updateTicket).toHaveBeenCalledWith(ticket.id, {
      category: 'AUTHENTICATION',
      priority: 'HIGH',
      assignedTeam: 'IDENTITY_SUPPORT',
    });
  });

  it('should return human review and not update the UI', async () => {
  const ticket: Ticket = {
    id: 'TKT-1002',
    title: 'Unknown issue',
    description: 'Customer provided unclear information.',
    customerType: CustomerType.STANDARD,
    status: TicketStatus.NEW,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: [],
    previousAttempts: 0,
    createdAt: new Date('2026-08-01T10:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
  };

  const queueItem: QueueItem = {
    id: 'QUEUE-1002',
    ticketId: ticket.id,
    status: QueueItemStatus.PROCESSING,
    attemptCount: 1,
    correlationId: 'correlation-1002',
    workerId: 'worker-1',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    claimedAt: new Date('2026-08-01T10:01:00Z'),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const ticketApiClient: TicketApiClient = {
    getAllTickets: vi.fn(),
    getTicketById: vi.fn().mockResolvedValue(ticket),
  };

  const aiProvider: AiProvider = {
    classifyTicket: vi.fn().mockResolvedValue({
      category: 'OTHER',
      priority: 'LOW',
      recommendedTeam: 'GENERAL_SUPPORT',
      recommendedAction: 'Review manually',
      confidence: 0.6,
      reasoningSummary: 'The classification is unclear.',
      riskIndicators: ['UNCLEAR_CLASSIFICATION'],
    }),
  };

  const ticketUiService: TicketUiService = {
    updateTicket: vi.fn(),
  };

  const businessRuleEngine = new BusinessRuleEngine([
    {
      name: 'LowConfidenceRule',
      evaluate: () => ({
        passed: false,
        requiresHumanReview: true,
        reason: 'AI confidence is below the required threshold.',
      }),
    },
  ]);

  const orchestrator = new TicketProcessingOrchestrator(
    ticketApiClient,
    aiProvider,
    businessRuleEngine,
    ticketUiService,
    pino({ enabled: false }),
  );

  const result = await orchestrator.process(queueItem);

  expect(result).toEqual({
    outcome: QueueProcessingOutcome.HUMAN_REVIEW,
    errorMessage: 'AI confidence is below the required threshold.',
  });

  expect(ticketUiService.updateTicket).not.toHaveBeenCalled();
});

it('should return failed when business rules reject the ticket', async () => {
  const ticket: Ticket = {
    id: 'TKT-1003',
    title: 'Already processed ticket',
    description: 'This ticket was already completed.',
    customerType: CustomerType.STANDARD,
    status: TicketStatus.CLOSED,
    priority: null,
    category: null,
    assignedTeam: null,
    tags: [],
    previousAttempts: 1,
    createdAt: new Date('2026-08-01T10:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
  };

  const queueItem: QueueItem = {
    id: 'QUEUE-1003',
    ticketId: ticket.id,
    status: QueueItemStatus.PROCESSING,
    attemptCount: 1,
    correlationId: 'correlation-1003',
    workerId: 'worker-1',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    claimedAt: new Date('2026-08-01T10:01:00Z'),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const ticketApiClient: TicketApiClient = {
    getAllTickets: vi.fn(),
    getTicketById: vi.fn().mockResolvedValue(ticket),
  };

  const aiProvider: AiProvider = {
    classifyTicket: vi.fn().mockResolvedValue({
      category: 'OTHER',
      priority: 'LOW',
      recommendedTeam: 'GENERAL_SUPPORT',
      recommendedAction: 'No action',
      confidence: 0.9,
      reasoningSummary: 'Ticket was already processed.',
      riskIndicators: [],
    }),
  };

  const ticketUiService: TicketUiService = {
    updateTicket: vi.fn(),
  };

  const businessRuleEngine = new BusinessRuleEngine([
    {
      name: 'AlreadyProcessedRule',
      evaluate: () => ({
        passed: false,
        requiresHumanReview: false,
        reason: 'Ticket was already processed.',
      }),
    },
  ]);

  const orchestrator = new TicketProcessingOrchestrator(
    ticketApiClient,
    aiProvider,
    businessRuleEngine,
    ticketUiService,
    pino({ enabled: false }),
  );

  const result = await orchestrator.process(queueItem);

  expect(result).toEqual({
    outcome: QueueProcessingOutcome.FAILED,
    errorMessage: 'Ticket was already processed.',
  });

  expect(ticketUiService.updateTicket).not.toHaveBeenCalled();
});

it('should throw when the ticket API fails', async () => {
  const queueItem: QueueItem = {
    id: 'QUEUE-1004',
    ticketId: 'TKT-1004',
    status: QueueItemStatus.PROCESSING,
    attemptCount: 1,
    correlationId: 'correlation-1004',
    workerId: 'worker-1',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    claimedAt: new Date('2026-08-01T10:01:00Z'),
    completedAt: null,
    nextAttemptAt: null,
    lastError: null,
  };

  const ticketApiClient: TicketApiClient = {
    getAllTickets: vi.fn(),
    getTicketById: vi.fn().mockRejectedValue(new Error('API unavailable')),
  };

  const aiProvider: AiProvider = {
    classifyTicket: vi.fn(),
  };

  const ticketUiService: TicketUiService = {
    updateTicket: vi.fn(),
  };

  const orchestrator = new TicketProcessingOrchestrator(
    ticketApiClient,
    aiProvider,
    new BusinessRuleEngine([]),
    ticketUiService,
    pino({ enabled: false }),
  );

  await expect(orchestrator.process(queueItem)).rejects.toThrow('API unavailable');

  expect(aiProvider.classifyTicket).not.toHaveBeenCalled();
  expect(ticketUiService.updateTicket).not.toHaveBeenCalled();
});
});