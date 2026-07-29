export interface RetryStrategy {
  calculateDelayMs(attemptNumber: number): number;
}