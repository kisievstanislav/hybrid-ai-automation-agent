import { describe, expect, it } from 'vitest';
import { ProcessingMetricsCalculator } from '../../../../src/application/reporting/services/ProcessingMetricsCalculator.js';

describe('ProcessingMetricsCalculator', () => {
  it('should calculate processing metrics', () => {
    const calculator = new ProcessingMetricsCalculator();

    const result = calculator.calculate([
      {
        status: 'COMPLETED',
        attemptCount: 1,
        createdAt: new Date('2026-08-06T10:00:00Z'),
        completedAt: new Date('2026-08-06T10:00:02Z'),
        aiConfidence: 0.9,
      },
      {
        status: 'HUMAN_REVIEW',
        attemptCount: 2,
        createdAt: new Date('2026-08-06T10:00:00Z'),
        completedAt: new Date('2026-08-06T10:00:04Z'),
        aiConfidence: 0.7,
      },
    ]);

    expect(result).toMatchObject({
      totalItems: 2,
      completedCount: 1,
      failedCount: 0,
      humanReviewCount: 1,
      totalRetryAttempts: 1,

      successRate: 0.5,
      failureRate: 0,
      humanReviewRate: 0.5,

      averageProcessingDurationMs: 3000,
      minimumProcessingDurationMs: 2000,
      maximumProcessingDurationMs: 4000,

      averageAiConfidence: 0.8,
      minimumAiConfidence: 0.7,
      maximumAiConfidence: 0.9,
    });

    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});
