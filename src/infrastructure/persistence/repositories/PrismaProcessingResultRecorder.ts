import { randomUUID } from 'node:crypto';

import type {
  ProcessingResultRecorder,
  RecordProcessingResultInput,
} from '../../../application/ports/reporting/ProcessingResultRecorder.js';
import { prisma } from '../../database/prisma-client.js';

export class PrismaProcessingResultRecorder implements ProcessingResultRecorder {
  async record(input: RecordProcessingResultInput): Promise<void> {
    await prisma.processingResult.create({
      data: {
        id: randomUUID(),
        queueItemId: input.queueItemId,
        ticketId: input.ticketId,
        correlationId: input.correlationId,
        decision: input.decision,
        aiClassification: {
          ...input.aiClassification,
          riskIndicators: [...input.aiClassification.riskIndicators],
        },
        successful: input.successful,
        message: input.message,
      },
    });
  }
}
