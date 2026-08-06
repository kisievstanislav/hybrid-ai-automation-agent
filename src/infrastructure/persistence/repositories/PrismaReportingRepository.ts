import type { ProcessingMetricsRecord } from '../../../application/reporting/models/ProcessingMetricsRecord.js';
import { ReportingRepository } from '../../../application/reporting/models/ReportingRepository.js';
import { prisma } from '../../database/prisma-client.js';

interface StoredAiClassification {
  confidence?: number;
}

export class PrismaReportingRepository implements ReportingRepository {
  async findAllMetricsRecords(): Promise<readonly ProcessingMetricsRecord[]> {
    const [queueItems, processingResults] = await Promise.all([
      prisma.queueItem.findMany(),
      prisma.processingResult.findMany({
        orderBy: {
          processedAt: 'desc',
        },
      }),
    ]);

    const confidenceByTicketId = new Map<string, number>();

    for (const result of processingResults) {
      if (confidenceByTicketId.has(result.ticketId)) {
        continue;
      }

      const aiClassification = result.aiClassification as StoredAiClassification;

      if (typeof aiClassification.confidence === 'number') {
        confidenceByTicketId.set(result.ticketId, aiClassification.confidence);
      }
    }

    return queueItems.map((item) => ({
      status: item.status,
      attemptCount: item.attemptCount,
      createdAt: item.claimedAt ?? item.createdAt,
      completedAt: item.completedAt,
      aiConfidence: confidenceByTicketId.get(item.ticketId) ?? null,
    }));
  }
}
