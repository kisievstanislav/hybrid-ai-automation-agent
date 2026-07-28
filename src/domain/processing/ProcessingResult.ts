import type {
  AiClassificationResult,
  TicketProcessingDecision,
} from "../ticket/index.js";

export interface ProcessingResult {
  readonly id: string;
  readonly ticketId: string;
  readonly queueItemId: string;
  readonly correlationId: string;
  readonly aiClassification: AiClassificationResult | null;
  readonly decision: TicketProcessingDecision;
  readonly successful: boolean;
  readonly message: string;
  readonly processedAt: Date;
}