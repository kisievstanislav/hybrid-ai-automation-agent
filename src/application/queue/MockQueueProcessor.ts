import type { QueueProcessor } from "./QueueProcessor.js";
import {
  QueueProcessingOutcome,
  type QueueProcessingResult,
} from "./QueueProcessingResult.js";

export class MockQueueProcessor implements QueueProcessor {
  async process(): Promise<QueueProcessingResult> {
    return {
      outcome: QueueProcessingOutcome.COMPLETED,
    };
  }
}