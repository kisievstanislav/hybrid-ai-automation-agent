import type { Logger } from 'pino';

import type { QueueItem } from '../../domain/index.js';
import { ProcessingDecision } from '../../domain/ticket/index.js';
import { TicketApiClient } from '../../infrastructure/api/ticket/TicketApiClient.js';
import type { AiProvider } from '../ports/ai/AiProvider.js';
import type { ProcessingResultRecorder } from '../ports/reporting/ProcessingResultRecorder.js';
import type { TicketUiService } from '../ports/ui/TicketUiService.js';
import type { QueueProcessor } from '../queue/QueueProcessor.js';
import {
  QueueProcessingOutcome,
  type QueueProcessingResult,
} from '../queue/QueueProcessingResult.js';
import type { BusinessRuleEngine } from '../rules/BusinessRuleEngine.js';
import { mapAiClassification } from './mapAiClassification.js';

export class TicketProcessingOrchestrator implements QueueProcessor {
  constructor(
    private readonly ticketApiClient: TicketApiClient,
    private readonly aiProvider: AiProvider,
    private readonly businessRuleEngine: BusinessRuleEngine,
    private readonly ticketUiService: TicketUiService,
    private readonly processingResultRecorder: ProcessingResultRecorder,
    private readonly logger: Logger,
  ) {}

  async process(queueItem: QueueItem): Promise<QueueProcessingResult> {
    this.logger.info(
      {
        queueItemId: queueItem.id,
        ticketId: queueItem.ticketId,
      },
      'Ticket processing started',
    );

    const ticket = await this.ticketApiClient.getTicketById(queueItem.ticketId);

    const aiClassification = await this.aiProvider.classifyTicket(ticket);

    const mappedClassification = mapAiClassification(aiClassification);

    const decision = this.businessRuleEngine.evaluate(ticket, mappedClassification);

    if (decision.decision === ProcessingDecision.HUMAN_REVIEW) {
      await this.processingResultRecorder.record({
        queueItemId: queueItem.id,
        ticketId: ticket.id,
        correlationId: queueItem.correlationId,
        decision: decision.decision,
        aiClassification,
        successful: true,
        message: decision.reason,
      });

      return {
        outcome: QueueProcessingOutcome.HUMAN_REVIEW,
        errorMessage: decision.reason,
      };
    }

    if (decision.decision === ProcessingDecision.REJECTED) {
      await this.processingResultRecorder.record({
        queueItemId: queueItem.id,
        ticketId: ticket.id,
        correlationId: queueItem.correlationId,
        decision: decision.decision,
        aiClassification,
        successful: false,
        message: decision.reason,
      });

      return {
        outcome: QueueProcessingOutcome.FAILED,
        errorMessage: decision.reason,
      };
    }

    if (
      decision.decision !== ProcessingDecision.AUTO_PROCESS ||
      decision.approvedCategory === null ||
      decision.approvedPriority === null ||
      decision.approvedTeam === null
    ) {
      const message = 'Business rules did not return a complete approved decision.';

      await this.processingResultRecorder.record({
        queueItemId: queueItem.id,
        ticketId: ticket.id,
        correlationId: queueItem.correlationId,
        decision: decision.decision,
        aiClassification,
        successful: false,
        message,
      });

      return {
        outcome: QueueProcessingOutcome.FAILED,
        errorMessage: message,
      };
    }

    await this.ticketUiService.updateTicket(ticket.id, {
      category: decision.approvedCategory,
      priority: decision.approvedPriority,
      assignedTeam: decision.approvedTeam,
    });

    await this.processingResultRecorder.record({
      queueItemId: queueItem.id,
      ticketId: ticket.id,
      correlationId: queueItem.correlationId,
      decision: decision.decision,
      aiClassification,
      successful: true,
      message: decision.reason,
    });

    this.logger.info(
      {
        queueItemId: queueItem.id,
        ticketId: ticket.id,
        decision: decision.decision,
      },
      'Ticket processing completed',
    );

    return {
      outcome: QueueProcessingOutcome.COMPLETED,
    };
  }
}
