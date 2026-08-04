export enum QueueProcessingOutcome {
  COMPLETED = 'COMPLETED',
  RETRY = 'RETRY',
  FAILED = 'FAILED',
  HUMAN_REVIEW = 'HUMAN_REVIEW',
}

export interface QueueProcessingResult {
  readonly outcome: QueueProcessingOutcome;
  readonly errorMessage?: string;
}
