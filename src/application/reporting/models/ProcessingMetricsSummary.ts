export interface ProcessingMetricsSummary {
  readonly totalItems: number;

  readonly completedCount: number;
  readonly failedCount: number;
  readonly humanReviewCount: number;
  readonly retryPendingCount: number;
  readonly deadLetterCount: number;

  readonly totalRetryAttempts: number;

  readonly successRate: number;
  readonly failureRate: number;
  readonly humanReviewRate: number;

  readonly averageProcessingDurationMs: number | null;
  readonly minimumProcessingDurationMs: number | null;
  readonly maximumProcessingDurationMs: number | null;

  readonly averageAiConfidence: number | null;
  readonly minimumAiConfidence: number | null;
  readonly maximumAiConfidence: number | null;

  readonly generatedAt: Date;
}
