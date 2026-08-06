import type { AiClassificationResult } from '../ai/AiProvider.js';
import type { ProcessingDecision } from '../../../domain/ticket/index.js';

export interface RecordProcessingResultInput {
  readonly queueItemId: string;
  readonly ticketId: string;
  readonly correlationId: string;
  readonly decision: ProcessingDecision;
  readonly aiClassification: AiClassificationResult;
  readonly successful: boolean;
  readonly message: string;
}

export interface ProcessingResultRecorder {
  record(input: RecordProcessingResultInput): Promise<void>;
}
