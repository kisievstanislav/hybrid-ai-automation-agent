import type { ProcessingMetricsRecord } from '../models/ProcessingMetricsRecord.js';
import type { ProcessingMetricsSummary } from '../models/ProcessingMetricsSummary.js';

export class ProcessingMetricsCalculator {
  calculate(records: readonly ProcessingMetricsRecord[]): ProcessingMetricsSummary {
    const totalItems = records.length;

    const completedCount = this.countStatus(records, 'COMPLETED');
    const failedCount = this.countStatus(records, 'FAILED');
    const humanReviewCount = this.countStatus(records, 'HUMAN_REVIEW');
    const retryPendingCount = this.countStatus(records, 'RETRY_PENDING');
    const deadLetterCount = this.countStatus(records, 'DEAD_LETTER');

    const durations = this.getProcessingDurations(records);
    const confidenceValues = this.getConfidenceValues(records);

    const totalRetryAttempts = records.reduce(
      (total, record) => total + Math.max(record.attemptCount - 1, 0),
      0,
    );

    return {
      totalItems,
      completedCount,
      failedCount,
      humanReviewCount,
      retryPendingCount,
      deadLetterCount,
      totalRetryAttempts,

      successRate: this.calculateRate(completedCount, totalItems),
      failureRate: this.calculateRate(failedCount, totalItems),
      humanReviewRate: this.calculateRate(humanReviewCount, totalItems),

      averageProcessingDurationMs: this.calculateAverage(durations),
      minimumProcessingDurationMs: this.calculateMinimum(durations),
      maximumProcessingDurationMs: this.calculateMaximum(durations),

      averageAiConfidence: this.calculateAverage(confidenceValues),
      minimumAiConfidence: this.calculateMinimum(confidenceValues),
      maximumAiConfidence: this.calculateMaximum(confidenceValues),

      generatedAt: new Date(),
    };
  }

  private countStatus(records: readonly ProcessingMetricsRecord[], status: string): number {
    return records.filter((record) => record.status === status).length;
  }

  private calculateRate(count: number, total: number): number {
    return total === 0 ? 0 : count / total;
  }

  private getProcessingDurations(records: readonly ProcessingMetricsRecord[]): number[] {
    return records
      .filter(
        (record): record is ProcessingMetricsRecord & { completedAt: Date } =>
          record.completedAt !== null,
      )
      .map((record) => record.completedAt.getTime() - record.createdAt.getTime());
  }

  private getConfidenceValues(records: readonly ProcessingMetricsRecord[]): number[] {
    return records
      .map((record) => record.aiConfidence)
      .filter((confidence): confidence is number => confidence !== null);
  }

  private calculateAverage(values: readonly number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    const total = values.reduce((sum, value) => sum + value, 0);

    return total / values.length;
  }

  private calculateMinimum(values: readonly number[]): number | null {
    return values.length === 0 ? null : Math.min(...values);
  }

  private calculateMaximum(values: readonly number[]): number | null {
    return values.length === 0 ? null : Math.max(...values);
  }
}
