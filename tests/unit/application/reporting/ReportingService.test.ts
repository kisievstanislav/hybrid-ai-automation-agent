import { describe, expect, it, vi } from 'vitest';
import { ProcessingMetricsCalculator } from '../../../../src/application/reporting/services/ProcessingMetricsCalculator.js';
import { ReportingService } from '../../../../src/application/reporting/services/ReportingService.js';
import { ReportingRepository } from '../../../../src/application/reporting/models/ReportingRepository.js';

describe('ReportingService', () => {
  it('should generate a metrics summary', async () => {
    const reportingRepository: ReportingRepository = {
      findAllMetricsRecords: vi.fn().mockResolvedValue([
        {
          status: 'COMPLETED',
          attemptCount: 1,
          createdAt: new Date('2026-08-06T10:00:00Z'),
          completedAt: new Date('2026-08-06T10:00:02Z'),
          aiConfidence: 0.9,
        },
      ]),
    };

    const service = new ReportingService(reportingRepository, new ProcessingMetricsCalculator());

    const result = await service.generateSummary();

    expect(reportingRepository.findAllMetricsRecords).toHaveBeenCalledOnce();

    expect(result).toMatchObject({
      totalItems: 1,
      completedCount: 1,
      successRate: 1,
      averageProcessingDurationMs: 2000,
      averageAiConfidence: 0.9,
    });
  });
});
