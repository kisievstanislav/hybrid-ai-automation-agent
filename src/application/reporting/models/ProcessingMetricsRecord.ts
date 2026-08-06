export interface ProcessingMetricsRecord {
  readonly status: string;
  readonly attemptCount: number;

  readonly createdAt: Date;
  readonly completedAt: Date | null;

  readonly aiConfidence: number | null;
}
